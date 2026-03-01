// ================================================================
// GoAgents 业务接口封装
// ================================================================
// 引入 SSE 流式请求客户端及其类型
import { fetchSSE, type SSECallbacks, type SSEEventData } from '../sseClient';

// 引入业务类型定义
import type {
  PretestRequestPayload,
  PretestResponse,
  StudyPlanRequestPayload,
  StudyPlanResponse,
} from './types';
import { API_PREFIX } from '../../config/api';

// 重新导出类型，方便外部统一从此模块引入
export type {
  GoAgentsProfileFields,
  PretestRequestPayload,
  PretestResponse,
  PretestQuestion,
  PretestOption,
  StudyPlanRequestPayload,
  StudyPlanResponse,
  StudyPlanStage,
} from './types';

// ================================================================
// 常量：API 路径前缀（经 Vite proxy 转发至后端 8080 端口）
// ================================================================

/** 后端真实接口路径（根路径） */
const PRETEST_ENDPOINT = '/pretest';

/** 后端真实接口路径（根路径） */
const STUDY_PLAN_ENDPOINT = '/studyplan';

/** 代理后请求路径 */
const PRETEST_URL = `${API_PREFIX.GOAGENTS}${PRETEST_ENDPOINT}`;

/** 代理后请求路径 */
const STUDY_PLAN_URL = `${API_PREFIX.GOAGENTS}${STUDY_PLAN_ENDPOINT}`;

// ================================================================
// 业务回调类型（在通用 SSECallbacks 基础上增加强类型 onData）
// ================================================================

/** 学前测流式回调 */
export interface PretestCallbacks extends Omit<SSECallbacks, 'onData'> {
  /** 每收到一条学前测 result 事件时触发，载荷已强类型化 */
  onData?: (data: PretestResponse) => void;
}

/** 学习计划流式回调 */
export interface StudyPlanCallbacks extends Omit<SSECallbacks, 'onData'> {
  /** 每收到一条学习计划 result 事件时触发，载荷已强类型化 */
  onData?: (data: StudyPlanResponse) => void;
}

// ================================================================
// 核心业务函数
// ================================================================

/**
 * 生成学前测（流式）
 *
 * 调用后端学前测生成接口，通过 SSE 流式返回题目数据。
 * 请求体为扁平化画像字段 + 业务参数，严禁嵌套（画像结构铁律）。
 * 路由铁律：严格使用 /pretest 原生路径，严禁拼接 /generate 后缀。
 *
 * @param payload   - 扁平化画像 + 学前测业务参数（age, gender, language, duration, profile_text, question_count）
 * @param callbacks - 流式事件回调集合
 * @param signal    - 可选的 AbortSignal，用于手动取消请求
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * fetchPretest(
 *   {
 *     age: 14,
 *     gender: '男',
 *     language: 'zh-CN',
 *     duration: '30',
 *     profile_text: '初中生，数学薄弱',
 *     question_count: 10,
 *   },
 *   {
 *     onStatus: (s) => console.log('状态:', s),
 *     onData:   (d) => console.log('学前测数据:', d),
 *     onError:  (e) => console.error('错误:', e),
 *     onComplete: () => console.log('学前测生成完毕'),
 *   },
 *   controller.signal,
 * );
 * ```
 */
export function fetchPretest(
  payload: PretestRequestPayload,
  callbacks?: PretestCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  // 将强类型回调适配为通用 SSECallbacks
  const sseCallbacks: SSECallbacks = {
    onStatus: callbacks?.onStatus,
    onError: callbacks?.onError,
    onComplete: callbacks?.onComplete,
    // 从 SSEEventData 中提取 result 字段并强制转型
    onData: (raw: SSEEventData) => {
      if (raw.result) {
        callbacks?.onData?.(raw.result as PretestResponse);
      }
    },
  };

  return fetchSSE({
    url: PRETEST_URL,
    payload: payload as unknown as Record<string, unknown>,
    callbacks: sseCallbacks,
    signal,
  });
}

/**
 * 生成学习计划（流式）
 *
 * 调用后端学习计划生成接口，通过 SSE 流式返回计划节点数据。
 * 请求体为扁平化画像字段 + 业务参数，严禁嵌套（画像结构铁律）。
 * 路由铁律：严格使用 /studyplan 原生路径，严禁拼接 /generate 后缀。
 *
 * @param payload   - 扁平化画像字段（age, gender, language, duration, profile_text）
 * @param callbacks - 流式事件回调集合
 * @param signal    - 可选的 AbortSignal，用于手动取消请求
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * fetchStudyPlan(
 *   {
 *     age: 14,
 *     gender: '男',
 *     language: 'zh-CN',
 *     duration: '30',
 *     profile_text: '初中生，数学薄弱',
 *   },
 *   {
 *     onStatus: (s) => console.log('状态:', s),
 *     onData:   (d) => console.log('学习计划:', d),
 *     onError:  (e) => console.error('错误:', e),
 *     onComplete: () => console.log('计划生成完毕'),
 *   },
 *   controller.signal,
 * );
 * ```
 */
export function fetchStudyPlan(
  payload: StudyPlanRequestPayload,
  callbacks?: StudyPlanCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  // 将强类型回调适配为通用 SSECallbacks
  const sseCallbacks: SSECallbacks = {
    onStatus: callbacks?.onStatus,
    onError: callbacks?.onError,
    onComplete: callbacks?.onComplete,
    // 从 SSEEventData 中提取 result 字段并强制转型
    onData: (raw: SSEEventData) => {
      if (raw.result) {
        callbacks?.onData?.(raw.result as StudyPlanResponse);
      }
    },
  };

  return fetchSSE({
    url: STUDY_PLAN_URL,
    payload: payload as unknown as Record<string, unknown>,
    callbacks: sseCallbacks,
    signal,
  });
}
