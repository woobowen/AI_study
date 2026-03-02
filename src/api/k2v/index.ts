import { API_PREFIX } from '../../config/api';
import type {
  GenerateVideoPayload,
  GenerateVideoSSEParams,
  GenerateVideoSSECallbacks,
  K2VStreamEventData,
} from './types';

/** K2V 开发环境 API Key（后续可迁移到环境变量） */
export const K2V_API_KEY = 'dev-api-key-12345';

/** 生成视频接口路径 */
const GENERATE_VIDEO_URL = `${API_PREFIX.K2V}/api/v1/generate-video`;
/** SSE 直连路径（按联调约定固定为此地址） */
const GENERATE_VIDEO_SSE_URL = '/api/k2v/api/v1/generate-video';

/** K2V 流式回调集合 */
export interface K2VStreamCallbacks {
  /** 服务进入运行态 */
  onRunning?: () => void;
  /** 服务正常完成 */
  onFinished?: () => void;
  /** 服务失败（业务失败） */
  onFailed?: (message: string) => void;
  /** 收到结果数据 */
  onResult?: (data: unknown) => void;
  /** 网络错误或解析错误 */
  onError?: (message: string) => void;
}


/** K2V 单条 SSE 事件数据结构（用于 JSON 反序列化） */
interface K2VSSEPayload {
  /** 事件类型（部分后端会放在 data 内） */
  type?: string;
  /** 业务结果 */
  data?: unknown;
  /** 错误文本 */
  error?: string;
  /** 通用消息 */
  message?: string;
  /** 允许后端附加扩展字段 */
  [key: string]: unknown;
}

/**
 * 发起 K2V 视频生成请求并消费 SSE 流。
 * 注意：本函数强制注入 X-API-Key，严禁裸奔调用。
 */
export async function generateVideo(
  payload: GenerateVideoPayload,
  callbacks: K2VStreamCallbacks = {},
): Promise<void> {
  const response = await fetch(GENERATE_VIDEO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': K2V_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const message = `K2V 请求失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`;
    callbacks.onError?.(message);
    throw new Error(message);
  }

  if (!response.body) {
    const message = 'K2V 响应体为空，无法解析 SSE 流';
    callbacks.onError?.(message);
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let currentEvent = '';
  let currentDataLines: string[] = [];

  /** 处理一个完整 SSE 事件块 */
  const flushEvent = (): void => {
    if (!currentEvent && currentDataLines.length === 0) return;

    const rawData = currentDataLines.join('\n').trim();
    let parsed: K2VSSEPayload = {};

    if (rawData) {
      try {
        parsed = JSON.parse(rawData) as K2VSSEPayload;
      } catch {
        // 若 data 非 JSON，保留原文作为 message
        parsed = { message: rawData };
      }
    }

    // 事件类型优先级：event 行 > data.type 字段
    const eventType = currentEvent || String(parsed.type ?? '').trim();
    const errorMessage = String(parsed.error ?? parsed.message ?? 'K2V 服务异常');

    switch (eventType) {
      case 'running':
        callbacks.onRunning?.();
        break;
      case 'finished':
        callbacks.onFinished?.();
        break;
      case 'failed':
        callbacks.onFailed?.(errorMessage);
        break;
      case 'result':
        // 后端通常将有效载荷放在 data 字段；若不存在则透传整个对象
        callbacks.onResult?.(parsed.data ?? parsed);
        break;
      default:
        // 未识别事件不抛错，避免中断有效流
        break;
    }

    currentEvent = '';
    currentDataLines = [];
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        flushEvent();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        // 空行表示一个事件块结束
        if (!line.trim()) {
          flushEvent();
          continue;
        }

        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          currentDataLines.push(line.slice(5).trim());
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'K2V SSE 流解析失败';
    callbacks.onError?.(message);
    throw error instanceof Error ? error : new Error(message);
  }
}

/**
 * 生成视频（SSE 版）
 * 仅要求传入知识点和难度，其他画像字段在开发期以默认值兜底。
 */
export async function generateVideoSSE(
  params: GenerateVideoSSEParams,
  callbacks: GenerateVideoSSECallbacks = {},
): Promise<void> {
  const payload: GenerateVideoPayload = {
    knowledge_point: params.knowledge_point,
    difficulty: params.difficulty,
    // 默认值兜底 + 支持 UI 层显式注入画像字段
    age: Math.max(0, Number(params.age ?? 14) || 14),
    gender: String(params.gender ?? ''),
    language: String(params.language ?? 'Python'),
    duration: Number(params.duration ?? 5) || 5,
    extra_info: params.extra_info,
  };

  const response = await fetch(GENERATE_VIDEO_SSE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': K2V_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const message = `K2V 请求失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`;
    callbacks.onError?.(message);
    throw new Error(message);
  }

  if (!response.body) {
    const message = 'K2V 响应体为空，无法解析 SSE 流';
    callbacks.onError?.(message);
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let currentEvent = '';
  let currentDataLines: string[] = [];

  /** 解析并派发单个事件块 */
  const flushEvent = (): void => {
    if (!currentEvent && currentDataLines.length === 0) return;

    const rawData = currentDataLines.join('\n').trim();
    let parsed: K2VSSEPayload = {};

    if (rawData) {
      try {
        parsed = JSON.parse(rawData) as K2VSSEPayload;
      } catch {
        parsed = { message: rawData };
      }
    }

    const eventType = currentEvent || String(parsed.type ?? '').trim();
    const data = (parsed.data ?? {}) as K2VStreamEventData;
    const message = String(
      data.message ??
      parsed.message ??
      parsed.error ??
      (eventType === 'running' ? 'AI 正在生成视频...' : ''),
    );

    switch (eventType) {
      case 'running':
        callbacks.onRunning?.(message);
        break;
      case 'finished':
        callbacks.onFinished?.(message || '视频生成完成');
        break;
      case 'failed':
        callbacks.onFailed?.(message || '视频生成失败');
        break;
      case 'error':
        callbacks.onError?.(message || '视频生成异常');
        break;
      case 'result': {
        const videoFile = String(data.video_file ?? '');
        callbacks.onResult?.(videoFile, message);
        break;
      }
      default:
        break;
    }

    currentEvent = '';
    currentDataLines = [];
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        flushEvent();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          flushEvent();
          continue;
        }
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          currentDataLines.push(line.slice(5).trim());
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'K2V SSE 流解析失败';
    callbacks.onError?.(message);
    throw error instanceof Error ? error : new Error(message);
  }
}

/** 根据后端返回的文件名拼接视频资源地址 */
export function getK2VVideoUrl(filename: string): string {
  return `${API_PREFIX.K2V}/api/v1/files/${filename}`;
}

export type {
  GenerateVideoPayload,
  K2VDifficulty,
  TaskStatusResponse,
  GenerateVideoSSEParams,
  GenerateVideoSSECallbacks,
  K2VStreamEventData,
} from './types';
