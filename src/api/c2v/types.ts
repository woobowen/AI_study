// ================================================================
// C2V (Code2Video) 接口类型定义
// ================================================================

/** C2V 视频生成请求体（必须严格对齐后端字段） */
export interface C2VGeneratePayload {
  /** 题目描述 */
  problem_description: string;
  /** 解决方案代码 */
  solution_code: string;
}

/** C2V 流式消息回调 */
export type C2VOnMessage = (event: string, data: any) => void;

/** C2V 异常回调 */
export type C2VOnError = (err: any) => void;

/** C2V 完成回调 */
export type C2VOnComplete = () => void;

/** C2V SSE 单条事件结构 */
export interface C2VStreamPacket {
  /** 事件类型（部分后端会放在 data 内） */
  type?: string;
  /** 业务载荷 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 通用消息 */
  message?: string;
  /** 允许后端扩展 */
  [key: string]: unknown;
}
