import { getUserProfilePayload, type UserProfile } from '../store/useUserStore';

// ================================================================
// 类型定义
// ================================================================

/** SSE 流的运行状态 */
export type SSEStatus = 'running' | 'finished' | 'failed';

/** 后端 SSE 单条事件的 JSON 结构（按实际协议扩展） */
export interface SSEEventData {
  /** 事件类型标识，由后端定义 */
  type?: string;
  /** 实际业务数据载荷 */
  result?: unknown;
  /** 后端显式标记流结束 */
  done?: boolean;
  /** 错误信息（仅在异常时存在） */
  error?: string;
  /** 允许后端扩展任意字段 */
  [key: string]: unknown;
}

/** 调用方传入的回调集合 */
export interface SSECallbacks {
  /**
   * 流状态变更回调
   * - running:  首次收到数据 / 流进行中
   * - finished: 流正常结束
   * - failed:   网络异常或后端报错
   */
  onStatus?: (status: SSEStatus) => void;

  /**
   * 每收到一条有效 SSE data 行时触发，
   * 将解析后的 JSON 对象透传给 UI 层。
   */
  onData?: (data: SSEEventData) => void;
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

  // ---------- 1. 构造请求体：自动注入用户画像 ----------
  let mergedPayload: Record<string, unknown> = { ...payload };

  if (!skipProfile) {
    const userProfile: UserProfile = getUserProfilePayload();
    // 将画像挂载到 payload 的 userProfile 字段下，避免字段冲突
    mergedPayload = {
      ...mergedPayload,
      userProfile,
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

    // SSE 协议中，事件以双换行分隔；单行以 "data: " 开头
    // 这里维护一个缓冲区处理 TCP 分包 / 粘包
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 流自然结束，处理缓冲区中可能残留的最后一行
        if (buffer.trim()) {
          processSSELine(buffer.trim(), onData);
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
          // SSE 协议：空行表示事件边界，此处跳过
          continue;
        }
        processSSELine(trimmed, onData);
      }
    }

    // ---------- 5. 流正常结束 ----------
    onStatus?.('finished');
  } catch (err: unknown) {
    // ---------- 6. 异常处理（网络中断、手动 abort 等） ----------
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 用户主动取消，视为正常结束
      onStatus?.('finished');
      return;
    }

    onStatus?.('failed');
    const message = err instanceof Error ? err.message : '未知网络错误';
    onData?.({ error: message });
  }
}

// ================================================================
// 内部工具：解析单行 SSE data
// ================================================================

/**
 * 处理 SSE 协议中的单行文本。
 * 标准 SSE 行格式为 `data: <JSON字符串>`，
 * 本函数提取 JSON 并反序列化后通过 onData 回调透传。
 *
 * @param line   - 去除首尾空白后的单行文本
 * @param onData - 数据回调
 */
function processSSELine(
  line: string,
  onData?: (data: SSEEventData) => void,
): void {
  // 仅处理 "data:" 开头的行；忽略 "event:"、"id:"、"retry:" 等
  if (!line.startsWith('data:')) {
    return;
  }

  // 提取 "data:" 后的内容
  const raw = line.slice(5).trim();

  // SSE 协议约定：`data: [DONE]` 表示流结束标记（部分后端实现）
  if (raw === '[DONE]') {
    return;
  }

  // 尝试将内容解析为 JSON
  try {
    const parsed: SSEEventData = JSON.parse(raw);
    onData?.(parsed);
  } catch {
    // 非 JSON 格式的 data 行，包装为纯文本透传
    onData?.({ result: raw });
  }
}
