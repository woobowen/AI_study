import { API_PREFIX } from '../../config/api';
import { fetchSSE, type SSECallbacks, type SSEEventData } from '../sseClient';
import type {
  KnowledgeExplanationRequest,
  KnowledgeExplanationResult,
} from './types';

/** 后端真实接口路径（根路径） */
const KNOWLEDGE_EXPLANATION_ENDPOINT = '/knowledge-explanation';
/** 代理后请求路径 */
const KNOWLEDGE_EXPLANATION_URL = `${API_PREFIX.GOAGENTS}${KNOWLEDGE_EXPLANATION_ENDPOINT}`;

/** 知识点讲解流式回调（与既有 goagents SSE 回调签名一致） */
export interface KnowledgeExplanationCallbacks extends Omit<SSECallbacks, 'onData'> {
  /** 每收到一条知识点讲解 result 事件时触发，载荷已强类型化 */
  onData?: (data: KnowledgeExplanationResult) => void;
}

/**
 * 生成知识点讲解（流式）
 *
 * - 终点路由：`/api/goagents/knowledge-explanation`
 * - 载荷字段：补充画像严格使用 `profile_text`
 * - SSE 结果：命中 `event: result` 后，对 `data` 字符串执行 JSON.parse 并回传强类型结果
 */
export function generateKnowledgeExplanation(
  payload: KnowledgeExplanationRequest,
  callbacks?: KnowledgeExplanationCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const sseCallbacks: SSECallbacks = {
    onStatus: callbacks?.onStatus,
    onError: callbacks?.onError,
    onComplete: callbacks?.onComplete,
    onData: (raw: SSEEventData) => {
      if (raw.result === undefined || raw.result === null) {
        return;
      }

      try {
        // 兼容后端常见结构：result 为字符串 JSON，或 result.data 为字符串 JSON
        const normalized =
          typeof raw.result === 'string'
            ? (JSON.parse(raw.result) as KnowledgeExplanationResult)
            : (
                raw.result &&
                typeof raw.result === 'object' &&
                'data' in raw.result &&
                typeof (raw.result as Record<string, unknown>).data === 'string'
              )
              ? (
                  JSON.parse(
                    (raw.result as Record<string, string>).data,
                  ) as KnowledgeExplanationResult
                )
              : (raw.result as KnowledgeExplanationResult);

        callbacks?.onData?.(normalized);
      } catch (error) {
        const message =
          error instanceof Error
            ? `knowledge-explanation result 解析失败: ${error.message}`
            : 'knowledge-explanation result 解析失败';
        callbacks?.onError?.(message);
      }
    },
  };

  return fetchSSE({
    url: KNOWLEDGE_EXPLANATION_URL,
    payload: payload as unknown as Record<string, unknown>,
    callbacks: sseCallbacks,
    signal,
  });
}

