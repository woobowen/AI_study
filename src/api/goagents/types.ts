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
// 画像生成 (Personal Profile) 相关类型
// ----------------------------------------------------------------

/** 画像生成响应结构 */
export interface PersonalProfileResponse {
  /** 大模型生成的用户画像摘要 */
  personal_profile: string;
  /** 允许后端附加扩展字段 */
  [key: string]: unknown;
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

/** 画像生成请求载荷 — 扁平化画像 + 可选答题上下文 */
export interface PersonalProfileRequestPayload extends GoAgentsProfileFields {
  /** 学前测答案文本（可选） */
  answers?: string[];
}

/** 学习计划请求载荷 — 扁平化画像 + 业务参数 */
export type StudyPlanRequestPayload = GoAgentsProfileFields;

// ----------------------------------------------------------------
// 知识点讲解 (Knowledge Explanation) 相关类型
// ----------------------------------------------------------------

/** 知识点讲解请求载荷 */
export interface KnowledgeExplanationRequest {
  /** 目标知识点（必填） */
  knowledge_point: string;
  /** 用户年龄（可选） */
  age?: number;
  /** 用户性别（可选） */
  gender?: string;
  /** 学习语言（可选） */
  language?: string;
  /** 学习周期（可选） */
  duration?: string;
  /** 画像补充文本（可选，GoAgents 契约字段） */
  profile_text?: string;
}

/** 思维导图分支 */
export interface MindMapBranch {
  /** 分支标题 */
  title: string;
  /** 分支摘要 */
  summary: string;
  /** 子主题列表 */
  sub_topics: string[];
}

/** 思维导图根节点 */
export interface MindMap {
  /** 根主题 */
  root_topic: string;
  /** 主分支数组 */
  main_branches: MindMapBranch[];
}

/** 知识点讲解最终结果 */
export interface KnowledgeExplanationResult {
  /** 回传的知识点 */
  knowledge_point: string;
  /** Markdown 讲解正文 */
  markdown: string;
  /** 思维导图结构 */
  mind_map: MindMap;
}
