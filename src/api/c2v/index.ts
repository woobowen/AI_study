import { API_PREFIX } from '../../config/api';
import { getUserC2VProfileContext } from '../../store/useUserStore';

/** C2V 开发环境 API Key */
const C2V_API_KEY = 'dev-api-key-12345';

/** C2V 生成接口路径 */
const C2V_GENERATE_URL = `${API_PREFIX.C2V}/api/v1/generate-video`;

/** C2V 结果视频访问路径 */
const C2V_FILE_URL = `${API_PREFIX.C2V}/api/v1/files`;

/** C2V 生成参数 */
export interface GenerateC2VVideoParams {
  problem_description: string;
  solution_code: string;
  difficulty: 'simple' | 'medium' | 'hard';
  duration: number;
}

/** C2V SSE 回调集合 */
export interface GenerateC2VVideoCallbacks {
  onRunning?: (message: string) => void;
  onResult?: (videoFile: string, message: string) => void;
  onFinished?: (message: string) => void;
  onFailed?: (message: string) => void;
  onError?: (message: string) => void;
}

interface C2VStreamPacket {
  type?: string;
  data?: {
    video_file?: string;
    message?: string;
    [key: string]: unknown;
  };
  message?: string;
  error?: string;
  [key: string]: unknown;
}

interface C2VRequestPayload extends GenerateC2VVideoParams {
  age: number;
  language: string;
  extra_info: string;
}

export function getC2VVideoUrl(videoFile: string): string {
  return `${C2V_FILE_URL}/${videoFile}`;
}

/** 通过鉴权请求视频二进制并转换为本地 Blob URL，供 <video> 安全播放 */
export async function fetchC2VVideoBlobUrl(filename: string): Promise<string> {
  const response = await fetch(getC2VVideoUrl(filename), {
    method: 'GET',
    headers: {
      'X-API-Key': C2V_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`C2V 视频下载失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * 发起 C2V 生成请求：
 * 1. 固化 X-API-Key
 * 2. 注入 C2V Schema 所需画像字段（age/language/extra_info）
 * 3. 解析 SSE 事件并透传状态机回调
 */
export async function generateC2VVideo(
  params: GenerateC2VVideoParams,
  callbacks: GenerateC2VVideoCallbacks = {},
): Promise<void> {
  const { userProfile } = getUserC2VProfileContext();
  const payload: C2VRequestPayload = {
    problem_description: params.problem_description,
    solution_code: params.solution_code,
    duration: Math.max(1, Math.floor(params.duration || 0)),
    difficulty: params.difficulty,
    age: userProfile.age,
    language: userProfile.language,
    extra_info: userProfile.profile_summary,
  };

  try {
    const response = await fetch(C2V_GENERATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-API-Key': C2V_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const message = `C2V 请求失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`;
      callbacks.onError?.(message);
      throw new Error(message);
    }

    if (!response.body) {
      const message = 'C2V 响应体为空，无法解析 SSE 流';
      callbacks.onError?.(message);
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let currentEvent = '';
    let currentDataLines: string[] = [];

    const flushEvent = (): void => {
      if (!currentEvent && currentDataLines.length === 0) return;

      const rawData = currentDataLines.join('\n').trim();
      let parsed: C2VStreamPacket = {};

      if (rawData) {
        if (rawData === '[DONE]') {
          callbacks.onFinished?.('视频生成完成');
          currentEvent = '';
          currentDataLines = [];
          return;
        }

        try {
          parsed = JSON.parse(rawData) as C2VStreamPacket;
        } catch {
          parsed = { message: rawData };
        }
      }

      const eventType = currentEvent || String(parsed.type ?? '').trim();
      const data = parsed.data ?? {};
      const message = String(data.message ?? parsed.message ?? parsed.error ?? '').trim();

      switch (eventType) {
        case 'running':
          callbacks.onRunning?.(message || 'AI 正在生成视频...');
          break;
        case 'result': {
          const videoFile = String(data.video_file ?? '');
          callbacks.onResult?.(videoFile, message || '视频资源已就绪');
          break;
        }
        case 'finished':
          callbacks.onFinished?.(message || '视频生成完成');
          break;
        case 'failed': {
          const failedMessage = message || '视频生成失败';
          callbacks.onFailed?.(failedMessage);
          throw new Error(failedMessage);
        }
        case 'error': {
          const errorMessage = message || '视频生成异常';
          callbacks.onError?.(errorMessage);
          throw new Error(errorMessage);
        }
        default:
          if (message) {
            callbacks.onRunning?.(message);
          }
          break;
      }

      currentEvent = '';
      currentDataLines = [];
    };

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'C2V SSE 流解析失败';
    callbacks.onError?.(message);
    throw err instanceof Error ? err : new Error(message);
  }
}

// 向后兼容旧命名
export const generateVideo = generateC2VVideo;
