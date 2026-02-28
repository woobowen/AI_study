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
  /** 每日学习时长（分钟） */
  studyDuration: number;
  /** 当前学习阶段，如 '小学' | '初中' | '高中' */
  studyStage: string;
  /** 兴趣标签列表 */
  interests: string[];
}

/** Store 暴露的操作方法 */
interface UserStoreActions {
  /** 批量更新用户画像（支持部分字段） */
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** 重置为默认画像 */
  resetProfile: () => void;
}

/** 完整 Store 类型 = 数据 + 操作 */
type UserStore = UserProfile & UserStoreActions;

// ========================
// 默认画像初始值
// ========================
const DEFAULT_PROFILE: UserProfile = {
  userId: '',
  nickname: '',
  age: 0,
  language: 'zh-CN',
  studyDuration: 30,
  studyStage: '',
  interests: [],
};

// ========================
// 创建全局 Zustand Store
// ========================
export const useUserStore = create<UserStore>((set) => ({
  ...DEFAULT_PROFILE,

  /** 合并传入的部分字段到当前画像 */
  updateProfile: (patch) =>
    set((state) => ({ ...state, ...patch })),

  /** 将画像恢复为出厂默认值 */
  resetProfile: () => set({ ...DEFAULT_PROFILE }),
}));

// ========================
// 工具函数：获取当前画像快照
// ========================

/**
 * 从 Store 中提取纯数据画像（不含方法），
 * 供 Service 层（如 sseClient）合并到请求 Payload 中使用。
 */
export function getUserProfilePayload(): UserProfile {
  const { updateProfile, resetProfile, ...profile } =
    useUserStore.getState();
  return profile;
}
