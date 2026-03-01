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

/** 学习计划中的单个知识节点 */
export interface StudyPlanNode {
  /** 节点唯一标识 */
  nodeId: string;
  /** 知识点名称 */
  title: string;
  /** 知识点简要描述 */
  description?: string;
  /** 预计学习时长（分钟） */
  estimatedMinutes: number;
  /** 掌握度评估：0-100 */
  mastery?: number;
  /** 前置依赖节点 ID 列表 */
  prerequisites?: string[];
  /** 排序权重（越小越靠前） */
  order: number;
}

/** 学习计划完整响应结构（后端 SSE result 载荷） */
export interface StudyPlanResponse {
  /** 学习计划唯一标识 */
  planId: string;
  /** 学科 / 课程名称 */
  subject: string;
  /** 计划总天数 */
  totalDays: number;
  /** 每日建议学习时长（分钟） */
  dailyMinutes: number;
  /** 知识节点列表（按学习顺序排列） */
  nodes: StudyPlanNode[];
  /** 计划生成时间戳（ISO 8601） */
  createdAt?: string;
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
  /** 学习时长 */
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
export interface StudyPlanRequestPayload extends GoAgentsProfileFields {
  /** 学前测 ID（用于关联测评结果以生成个性化计划，可选） */
  pretestId?: string;
  /** 期望学习天数（可选） */
  totalDays?: number;
}
