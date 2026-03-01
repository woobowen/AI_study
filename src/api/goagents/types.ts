// ================================================================
// GoAgents 后端接口类型定义
// ================================================================

// ----------------------------------------------------------------
// 学前测 (Pretest) 相关类型
// ----------------------------------------------------------------

/** 单个选项 */
export interface PretestOption {
  /** 选项标识，如 'A' / 'B' / 'C' / 'D' */
  label: string;
  /** 选项文本内容 */
  text: string;
}

/** 学前测单道题目 */
export interface PretestQuestion {
  /** 题目唯一标识 */
  id: string;
  /** 题目文本 */
  question: string;
  /** 题目类型：单选 / 多选 / 判断 */
  type: 'single' | 'multiple' | 'boolean';
  /** 可选项列表 */
  options: PretestOption[];
  /** 正确答案标识（单选为字符串，多选为数组） */
  answer: string | string[];
  /** 题目所属知识点标签 */
  tag?: string;
  /** 难度等级：1-5 */
  difficulty?: number;
}

/** 学前测完整响应结构（后端 SSE result 载荷） */
export interface PretestResponse {
  /** 学前测唯一标识 */
  pretestId: string;
  /** 学科 / 课程名称 */
  subject: string;
  /** 题目列表 */
  questions: PretestQuestion[];
  /** 建议作答时长（分钟） */
  suggestedDuration?: number;
}

// ----------------------------------------------------------------
// 学习计划 (Study Plan) 相关类型
// ----------------------------------------------------------------

/** 学习计划中的单个阶段 */
export interface StudyPlanStage {
  /** 阶段名称，如“第1天”或“第1周” */
  stage_name: string;
  /** 当前阶段包含的知识点列表 */
  knowledge_points: string[];
}

/** 学习计划完整响应结构（后端 SSE result 载荷） */
export interface StudyPlanResponse {
  /** 分阶段学习计划 */
  stages: StudyPlanStage[];
}

// ----------------------------------------------------------------
// GoAgents 画像扁平化基础字段（核心微服务契约 — 画像结构铁律）
// 所有向 GoAgents 发送的画像数据必须是扁平化的一级字段，
// 绝对禁止嵌套在 userProfile 等包装对象中，
// 绝对禁止臆想 subject / context 等规范外字段。
// ----------------------------------------------------------------

/** GoAgents 画像扁平化字段（与后端一一对应） */
export interface GoAgentsProfileFields {
  /** 用户年龄 */
  age: number;
  /** 用户性别 */
  gender: string;
  /** 学习语言 */
  language: string;
  /** 总学习周期（如 4天 / 1周，将影响返回阶段数） */
  duration: string;
  /** 画像描述文本 */
  profile_text: string;
}

// ----------------------------------------------------------------
// 通用请求载荷类型
// ----------------------------------------------------------------

/** 学前测请求载荷 — 扁平化画像 + 业务参数 */
export interface PretestRequestPayload extends GoAgentsProfileFields {
  /** 期望题目数量（可选） */
  question_count?: number;
}

/** 学习计划请求载荷 — 扁平化画像 + 业务参数 */
export type StudyPlanRequestPayload = GoAgentsProfileFields;
