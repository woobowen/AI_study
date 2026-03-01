import { create } from 'zustand';

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
  /** 偏好语言，如 'zh-CN' | 'en-US' */
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
}

/** Store 暴露的操作方法 */
interface UserStoreActions {
  /** 批量更新用户画像（支持部分字段） */
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** 重置为默认画像 */
  resetProfile: () => void;
  /** 设置是否已生成学习计划 */
  setHasStudyPlan: (value: boolean) => void;
}

/** Store 顶层状态（画像之外的全局标记） */
interface UserStoreState {
  /** 用户画像对象 */
  userProfile: UserProfile;
  /** 是否已拥有学习计划（未完成引导前为 false） */
  hasStudyPlan: boolean;
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
  language: 'zh-CN',
  duration: '1周',
  studyStage: '初中',
  interests: ['数学', '编程'],
  level: 5,
  badges: ['连续打卡 7 天', '首次满分'],
  supplements: '',
};

// ========================
// 创建全局 Zustand Store
// ========================
export const useUserStore = create<UserStore>((set) => ({
  userProfile: { ...DEFAULT_PROFILE },
  hasStudyPlan: false,

  /** 合并传入的部分字段到当前画像 */
  updateProfile: (patch) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...patch },
    })),

  /** 将画像恢复为出厂默认值 */
  resetProfile: () =>
    set({ userProfile: { ...DEFAULT_PROFILE } }),

  /** 切换学习计划状态标记 */
  setHasStudyPlan: (value) =>
    set({ hasStudyPlan: value }),
}));

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
