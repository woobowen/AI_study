/**
 * 3D 沙盒后端期望的用户画像结构
 */
export interface Sandbox3DBackendProfile {
  /** 年龄 */
  age: number
  /** 性别 */
  gender: string
  /** 编程语言偏好 */
  programmingLanguage: string
  /** 学习周期 */
  studyCycle: string
  /** 难度等级 */
  difficulty: string
  /** 学习目标 */
  learningGoal: string
}

/**
 * 3D 沙盒生成接口请求体
 */
export interface Sandbox3DGeneratePayload {
  /** 知识点或概念描述 */
  concept: string
  /** 可选用户画像（按后端契约透传） */
  userProfile?: Sandbox3DBackendProfile
}

/**
 * 3D 沙盒 SSE 事件类型
 */
export const SANDBOX3D_SSE_EVENT = {
  PROGRESS: 'progress',
  ERROR: 'error',
  COMPLETE: 'complete',
} as const

/**
 * 3D 沙盒 SSE 事件联合类型
 */
export type Sandbox3DSseEvent =
  (typeof SANDBOX3D_SSE_EVENT)[keyof typeof SANDBOX3D_SSE_EVENT]

/**
 * 3D 沙盒最终产物结构
 */
export interface Sandbox3DResult {
  /** 后端产出 HTML 文件的内容哈希 */
  htmlSha256: string
}
