// ================================================================
// K2V (Knowledge2Video) 接口类型定义
// ================================================================

/** 视频生成难度枚举 */
export type K2VDifficulty = 'simple' | 'medium' | 'hard';

/** 生成视频请求体 */
export interface GenerateVideoPayload {
  /** 知识点文本（必填） */
  knowledge_point: string;
  /** 用户年龄 */
  age: number;
  /** 用户性别 */
  gender: string;
  /** 目标编程语言 */
  language: string;
  /** 视频时长（分钟） */
  duration: number;
  /** 视频讲解难度 */
  difficulty: K2VDifficulty;
  /** 补充信息（可选） */
  extra_info?: string;
}

/** 任务状态响应 */
export interface TaskStatusResponse {
  /** 任务 ID */
  task_id: string;
  /** 任务状态 */
  status: string;
  /** 任务结果（结构由后端动态决定） */
  result: unknown;
  /** 错误信息 */
  error: string | null;
}

/** SSE 事件 data 常见字段 */
export interface K2VStreamEventData {
  /** 进度文案 */
  message?: string;
  /** 生成后的视频文件名 */
  video_file?: string;
  /** 允许后端扩展 */
  [key: string]: unknown;
}

/** generateVideoSSE 入参 */
export interface GenerateVideoSSEParams {
  /** 知识点文本（必填） */
  knowledge_point: string;
  /** 难度 */
  difficulty: K2VDifficulty;
  /** 用户年龄（可选） */
  age?: number;
  /** 用户性别（可选） */
  gender?: string;
  /** 目标编程语言（可选） */
  language?: string;
  /** 视频时长（分钟，可选） */
  duration?: number;
  /** 额外上下文（可选） */
  extra_info?: string;
}

/** generateVideoSSE 回调集合 */
export interface GenerateVideoSSECallbacks {
  /** 生成任务进入运行态 */
  onRunning?: (message: string) => void;
  /** 生成任务完成态 */
  onFinished?: (message: string) => void;
  /** 生成任务失败态 */
  onFailed?: (message: string) => void;
  /** 收到结果事件（重点消费 video_file） */
  onResult?: (videoFile: string, message: string) => void;
  /** 网络或解析异常 */
  onError?: (message: string) => void;
}
