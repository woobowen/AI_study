import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ========================
// 用户画像类型定义
// ========================

/** 用户画像核心字段 */
export interface UserProfile {
  /** 用户唯一标识 */
  userId: string;
  /** 用户昵称 */
  nickname: string;
  /** 年龄 */
  age: number;
  /** 编程偏好语言（如 'Python' | 'Go' | 'C++'） */
  language: string;
  /** 总学习周期（如：1天 / 3天 / 1周 / 1个月） */
  duration: string;
  /** 当前学习阶段，如 '小学' | '初中' | '高中' */
  studyStage: string;
  /** 兴趣标签列表 */
  interests: string[];
  /** 用户等级 */
  level: number;
  /** 已获得的成就徽章列表 */
  badges: string[];
  /** 补充说明（用户自由填写的额外信息） */
  supplements: string;
  /** 大模型生成的画像摘要（供 K2V 等下游消费） */
  profile_summary: string;
}

/** 学习计划中的单个阶段 */
export interface StudyPlanStage {
  /** 阶段名称，如“第1天”或“第1周” */
  stage_name: string;
  /** 当前阶段包含的知识点列表 */
  knowledge_points: string[];
}

/** Onboarding 提交的画像契约（前后端共识字段） */
export interface OnboardingProfilePayload {
  age: number | string;
  language: string;
  studyDuration: number | string;
  supplements: string;
}

/** Store 暴露的操作方法 */
interface UserStoreActions {
  /** 批量更新用户画像（支持部分字段） */
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** 重置为默认画像 */
  resetProfile: () => void;
  /** 设置画像是否完善 */
  setIsProfileComplete: (value: boolean) => void;
  /** 设置学前测是否完成 */
  setIsPretestComplete: (value: boolean) => void;
  /** 设置是否已生成学习计划 */
  setHasStudyPlan: (value: boolean) => void;
  /** 注水学习计划阶段数据 */
  setStudyPlan: (plan: StudyPlanStage[]) => void;
  /** 设置是否已完成 Onboarding 全流程 */
  setHasCompletedOnboarding: (value: boolean) => void;
  /** 完成 Onboarding：落地画像并放行 Dashboard */
  completeOnboarding: (profileData: OnboardingProfilePayload) => void;
  /** 完成学前测：放行主控台 */
  completePretest: () => void;
  markKnowledgeMastered: (node: string) => void;
  /** 向动态知识图谱中追加已掌握节点（自动去重） */
  addMasteredNode: (node: string) => void;
}

/** Store 顶层状态（画像之外的全局标记） */
interface UserStoreState {
  /** 用户画像对象 */
  userProfile: UserProfile;
  /** 画像是否已完善 */
  isProfileComplete: boolean;
  /** 学前测是否已完成 */
  isPretestComplete: boolean;
  /** 是否已拥有学习计划（未完成引导前为 false） */
  hasStudyPlan: boolean;
  /** 学习计划阶段数据（用于全局状态注水） */
  studyPlan: StudyPlanStage[] | null;
  /** 是否已完成 Onboarding（路由守卫依据该标记） */
  hasCompletedOnboarding: boolean;
  /** 动态知识追踪图谱：已掌握知识点列表 */
  mastered_knowledge: string[];
}

/** 完整 Store 类型 = 状态 + 操作 */
type UserStore = UserStoreState & UserStoreActions;

// ========================
// 默认画像初始值
// ========================
const DEFAULT_PROFILE: UserProfile = {
  userId: 'u_001',
  nickname: '博闻',
  age: 14,
  language: 'Python',
  duration: '7天',
  studyStage: '初中',
  interests: ['数学', '编程'],
  level: 5,
  badges: ['连续打卡 7 天', '首次满分'],
  supplements: '我想学完Python的基础内容，我数学能力强，编程能力弱',
  profile_summary: '',
};

// ========================
// 创建全局 Zustand Store
// ========================
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userProfile: { ...DEFAULT_PROFILE },
      isProfileComplete: false,      // 业务回滚：新用户必须填画像
      isPretestComplete: false,      // 业务回滚：新用户必须做小测
      hasStudyPlan: false,           // 业务回滚：无计划
      hasCompletedOnboarding: false, // 业务回滚：未完成新手引导
      studyPlan: null,               // 业务回滚：置空，等待生成
      mastered_knowledge: [],

      /** 合并传入的部分字段到当前画像 */
      updateProfile: (patch) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...patch },
        })),

      /** 注入逃生舱逻辑：重置核心流程状态，触发重新引导 */
      resetProfile: () =>
        set({
          isProfileComplete: false,
          isPretestComplete: false,
          hasStudyPlan: false,
        }),

      /** 切换画像完成标记 */
      setIsProfileComplete: (value) =>
        set({ isProfileComplete: value }),

      /** 切换学前测完成标记 */
      setIsPretestComplete: (value) =>
        set({ isPretestComplete: value }),

      /** 切换学习计划状态标记 */
      setHasStudyPlan: (value) =>
        set({ hasStudyPlan: value }),

      /** 写入学习计划阶段数据 */
      setStudyPlan: (plan) =>
        set({ studyPlan: plan }),

      /** 切换 Onboarding 完成标记 */
      setHasCompletedOnboarding: (value) =>
        set({ hasCompletedOnboarding: value }),

      /** 完成 Onboarding：一次性更新画像并触发放行阀门 */
      completeOnboarding: (profileData) =>
        set((state) => {
          const rawDuration = String(profileData.studyDuration).trim();
          const duration = rawDuration.endsWith('天') ? rawDuration : `${rawDuration}天`;

          return {
            userProfile: {
              ...state.userProfile,
              age: Number(profileData.age) || state.userProfile.age,
              language: String(profileData.language).trim() || state.userProfile.language,
              duration,
              supplements: String(profileData.supplements),
            },
            isProfileComplete: true,
          };
        }),

      /** 完成学前测：仅切换测验完成标记 */
      completePretest: () =>
        set({ isPretestComplete: true }),

      // 知识点状态击穿：标记为已掌握（去重写入）
      markKnowledgeMastered: (node: string) => set((state) => {
        const currentMastered = state.mastered_knowledge || [];
        if (currentMastered.includes(node)) {
          return state; // 已经掌握，防重复触发
        }
        return {
          mastered_knowledge: [...currentMastered, node]
        };
      }),

      /** 追加掌握节点并去重，避免重复污染图谱 */
      addMasteredNode: (node) =>
        set((state) => ({
          mastered_knowledge: state.mastered_knowledge.includes(node)
            ? state.mastered_knowledge
            : [...state.mastered_knowledge, node],
        })),
    }),
    {
      name: 'ai-study-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ========================
// 工具函数：获取当前画像快照
// ========================

/**
 * 从 Store 中提取纯数据画像（不含方法），
 * 供 Service 层（如 sseClient）合并到请求 Payload 中使用。
 */
export function getUserProfilePayload(): UserProfile {
  return useUserStore.getState().userProfile;
}

/**
 * C2V 画像上下文兼容导出：
 * 返回结构保持历史约定，避免业务层重复改造。
 */
export function getUserC2VProfileContext(): { userProfile: UserProfile } {
  return {
    userProfile: useUserStore.getState().userProfile,
  };
}

/**
 * K2V 画像上下文兼容导出：
 * 与 C2V 保持同构，便于异构 AIGC 模块复用。
 */
export function getUserK2VProfileContext(): { userProfile: UserProfile } {
  return {
    userProfile: useUserStore.getState().userProfile,
  };
}
