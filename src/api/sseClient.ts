import { getUserProfilePayload } from '../store/useUserStore';
import type { GoAgentsProfileFields } from './goagents/types';

// ================================================================
// 类型定义
// ================================================================

/** SSE 流的运行状态（与后端事件类型一一对应，含 error） */
export type SSEStatus = 'running' | 'finished' | 'failed' | 'error';

/**
 * 后端业务错误（failed / error 事件）专用异常类。
 * 用于在 catch 中区分"后端主动推送的业务错误"与"网络异常"，
 * 避免回调被重复触发。
 */
class SSEBusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSEBusinessError';
  }
}

/**
 * 后端 SSE 单条事件的 JSON 结构。
 *
 * 后端约定的五种事件类型（与 GEMINI.md 流式通信铁律完全对应）：
 * - `running`  : 任务执行中
 * - `result`   : 携带最终结果数据
 * - `finished` : 任务已完成
 * - `failed`   : 任务失败
 * - `error`    : 携带错误信息
 */
export interface SSEEventData {
  /** 事件类型标识，由后端定义：running / result / finished / failed / error */
  type?: string;
  /** 实际业务数据载荷（仅 type=result 时有值） */
  result?: unknown;
  /** 后端显式标记流结束 */
  done?: boolean;
  /** 错误信息（type=failed 或 type=error 时存在） */
  error?: string;
  /** 错误消息字段（部分后端使用 message 而非 error） */
  message?: string;
  /** 允许后端扩展任意字段 */
  [key: string]: unknown;
}

/** 调用方传入的回调集合 */
export interface SSECallbacks {
  /**
   * 流状态变更回调
   * - running:  后端推送 type=running，表示流已启动
   * - finished: 后端推送 type=finished，表示流正常结束
   * - failed:   后端推送 type=failed 或网络异常
   */
  onStatus?: (status: SSEStatus) => void;

  /**
   * 每收到一条 type=result 的有效 SSE 事件时触发，
   * 将解析后的 JSON 对象透传给 UI 层。
   */
  onData?: (data: SSEEventData) => void;

  /**
   * 流出错时触发（后端 type=failed 或网络异常），
   * 传入错误描述字符串。
   */
  onError?: (errorMessage: string) => void;

  /**
   * 流正常结束时触发（后端 type=finished 或流自然关闭），
   * 可用于 UI 层收尾操作（如停止 loading 动画）。
   */
  onComplete?: () => void;
}

/** fetchSSE 的入参配置 */
export interface FetchSSEOptions {
  /** 请求目标 URL */
  url: string;
  /** 业务请求体（用户画像会被自动注入） */
  payload?: Record<string, unknown>;
  /** 回调函数集合 */
  callbacks?: SSECallbacks;
  /** 可选：外部传入 AbortSignal 以支持手动取消 */
  signal?: AbortSignal;
  /** 是否跳过自动注入用户画像，默认 false */
  skipProfile?: boolean;
}

// ================================================================
// 核心：基于原生 fetch 的 SSE 流式请求函数
// ================================================================

/**
 * 通用 SSE 流式请求客户端。
 *
 * 设计要点：
 * 1. 使用原生 fetch + ReadableStream 逐行解析 SSE 文本协议。
 * 2. 自动从全局 Store 获取用户画像并合并到请求 Payload（伍-1 铁律）。
 * 3. 通过 onStatus / onData 回调将流事件暴露给 UI 层（伍-2 铁律）。
 * 4. 严禁将流式响应当作普通 Promise 一次性消费。
 *
 * @param options - 请求配置项
 * @returns 一个 Promise，在流结束或出错后 resolve
 */
export async function fetchSSE(options: FetchSSEOptions): Promise<void> {
  const { url, payload = {}, callbacks = {}, signal, skipProfile = false } = options;
  const { onStatus, onData } = callbacks;

  // ---------- 1. 构造请求体：自动注入扁平化用户画像（画像结构铁律） ----------
  let mergedPayload: Record<string, unknown> = { ...payload };

  if (!skipProfile) {
    const store = getUserProfilePayload();
    // 将 Store 画像精准映射为 GoAgents 要求的扁平化一级字段
    // 绝对禁止嵌套在 userProfile 等包装对象中
    const flatProfile: GoAgentsProfileFields = {
      age: store.age,
      gender: '',
      language: store.language,
      duration: store.duration,
      profile_text: store.supplements || '',
    };
    mergedPayload = {
      ...flatProfile,
      ...mergedPayload,
    };
  }

  try {
    // ---------- 2. 发起 fetch 请求 ----------
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(mergedPayload),
      signal,
    });

    // 非 2xx 状态码视为失败
    if (!response.ok) {
      onStatus?.('failed');
      const errorText = await response.text().catch(() => '未知错误');
      onData?.({ error: `HTTP ${response.status}: ${errorText}` });
      return;
    }

    // 确保响应体存在可读流
    if (!response.body) {
      onStatus?.('failed');
      onData?.({ error: '响应体为空，无法读取 SSE 流' });
      return;
    }

    // ---------- 3. 通知 UI：流已开始 ----------
    onStatus?.('running');

    // ---------- 4. 逐行读取并解析 SSE 文本协议 ----------
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // SSE 协议中，事件以双换行分隔；
    // 需要同时解析 "event:" 和 "data:" 行，
    // 空行代表一个完整事件块的结束。
    let buffer = '';
    // 当前事件块中由 "event:" 行指定的事件类型
    let currentEventType = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 流自然结束，处理缓冲区中可能残留的最后一行
        if (buffer.trim()) {
          processSSELine(buffer.trim(), callbacks, currentEventType);
          currentEventType = '';
        }
        break;
      }

      // 将二进制块解码并追加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按换行符拆分，逐行处理
      const lines = buffer.split('\n');

      // 最后一个元素可能是不完整的行，留在缓冲区
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          // SSE 协议：空行表示事件边界，重置事件类型
          currentEventType = '';
          continue;
        }
        // 解析 "event:" 行，记录当前事件块的类型
        if (trimmed.startsWith('event:')) {
          currentEventType = trimmed.slice(6).trim();
          continue;
        }
        processSSELine(trimmed, callbacks, currentEventType);
      }
    }

    // ---------- 5. 流正常结束 ----------
    onStatus?.('finished');
    callbacks.onComplete?.();
  } catch (err: unknown) {
    // ---------- 6. 异常处理（网络中断、手动 abort、后端错误事件等） ----------
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 用户主动取消，视为正常结束
      onStatus?.('finished');
      callbacks.onComplete?.();
      return;
    }

    const message = err instanceof Error ? err.message : '未知网络错误';

    // 如果是 processSSELine 中因 failed/error 事件主动抛出的错误，
    // 回调已在抛出前触发过，此处不再重复调用回调；
    // 对于网络异常等非预期错误，需要补充触发回调通知 UI 层。
    if (!(err instanceof SSEBusinessError)) {
      onStatus?.('failed');
      onData?.({ error: message });
      callbacks.onError?.(message);
    }

    // 无论哪种来源，都向上层抛出，让调用方 try-catch 能捕获
    throw err instanceof Error ? err : new Error(message);
  }
}

// ================================================================
// 内部工具：解析单行 SSE data
// ================================================================

/**
 * 处理 SSE 协议中的单行文本。
 *
 * 标准 SSE 行格式为 `data: <JSON字符串>`，
 * 本函数提取 JSON 并根据事件类型进行语义分发。
 *
 * 事件类型优先级：
 * 1. 优先使用 `event:` 行声明的 eventType（SSE 标准协议）
 * 2. 其次使用 data JSON 内部的 type 字段（自定义协议兼容）
 *
 * 语义分发规则：
 * - running  → 触发 onStatus('running')
 * - result   → 触发 onData，将业务载荷透传给 UI
 * - finished → 触发 onStatus('finished') + onComplete
 * - failed   → 触发 onStatus('failed') + onError
 *
 * @param line      - 去除首尾空白后的单行文本
 * @param callbacks - 完整回调集合，用于语义分发
 * @param eventType - 由 SSE "event:" 行指定的事件类型（可选，优先级最高）
 */
function processSSELine(
  line: string,
  callbacks: SSECallbacks,
  eventType?: string,
): void {
  // 仅处理 "data:" 开头的行；忽略 "event:"、"id:"、"retry:" 等
  if (!line.startsWith('data:')) {
    return;
  }

  // 提取 "data:" 后的内容
  const raw = line.slice(5).trim();

  // SSE 协议约定：`data: [DONE]` 表示流结束标记（部分后端实现）
  if (raw === '[DONE]') {
    callbacks.onStatus?.('finished');
    callbacks.onComplete?.();
    return;
  }

  // 尝试将内容解析为 JSON
  try {
    const parsed: SSEEventData = JSON.parse(raw);

    // ---------- 确定事件类型：event: 行优先，其次 JSON 内 type 字段 ----------
    const resolvedType = eventType || parsed.type || '';

    // ---------- 根据事件类型进行语义分发 ----------
    switch (resolvedType) {
      case 'running':
        // 后端显式通知：流已启动 / 正在生成
        callbacks.onStatus?.('running');
        break;

      case 'result': {
        // 业务数据载荷，透传给 UI 层
        //
        // 两种后端返回模式：
        // A) JSON 内含 result 字段：{ type:"result", result: {...} }
        // B) event: result + data: {"message":"...","data":{...}}（无 result 字段，
        //    整个 parsed 即为业务载荷）
        //
        // 统一处理：优先取 parsed.result，若不存在则将整个 parsed 作为载荷
        const payload = parsed.result ?? parsed;

        // 检查载荷中是否存在嵌套的 data 字段（后端常见结构：{message, data:{questions:[]}}）
        if (
          payload &&
          typeof payload === 'object' &&
          !Array.isArray(payload) &&
          'data' in payload
        ) {
          // 嵌套结构：将内层 data 提升为 result，方便上层直接消费
          const inner = (payload as Record<string, unknown>).data;
          callbacks.onData?.({ ...parsed, result: inner });
        } else {
          // 扁平结构或无嵌套：包装到 result 字段中保证上层统一取值
          callbacks.onData?.({ ...parsed, result: payload });
        }
        break;
      }

      case 'finished':
        // 后端显式通知：流正常结束
        callbacks.onStatus?.('finished');
        callbacks.onComplete?.();
        break;

      case 'failed': {
        // 后端显式通知：处理异常 —— 立即中止流并抛出错误
        const failMsg = parsed.message ?? parsed.error ?? '后端处理异常（未提供详细信息）';
        callbacks.onStatus?.('failed');
        callbacks.onError?.(failMsg);
        throw new SSEBusinessError(failMsg);
      }

      case 'error': {
        // 后端显式推送错误事件 —— 立即中止流并抛出错误
        const errMsg = parsed.message ?? parsed.error ?? '后端返回错误（未提供详细信息）';
        callbacks.onStatus?.('error');
        callbacks.onError?.(errMsg);
        throw new SSEBusinessError(errMsg);
      }

      default:
        // 未知 type 或无 type 字段，作为通用数据透传
        callbacks.onData?.(parsed);
        break;
    }
  } catch (e) {
    // 如果是后端业务错误（failed/error 事件），必须继续向上抛出以中止流读取
    if (e instanceof SSEBusinessError) {
      throw e;
    }
    // 非 JSON 格式的 data 行，包装为纯文本透传
    callbacks.onData?.({ result: raw });
  }
}
