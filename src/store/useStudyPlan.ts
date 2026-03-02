import { create } from 'zustand';
import { fetchStudyPlan } from '../api/goagents';
import type { StudyPlanRequestPayload, StudyPlanResponse } from '../api/goagents';

// ========================
// 类型定义
// ========================

/** 学习计划全局状态 */
interface StudyPlanState {
  /** 后端学习计划原始返回（完整透传） */
  planData: StudyPlanResponse | null;
  /** 知识点学习状态表，key 形如 "阶段索引-知识点索引" */
  learnedPoints: Record<string, boolean>;
  /** 异步请求中的加载状态 */
  isLoading: boolean;
  /** 最近一次请求错误信息 */
  error: string | null;
}

/** 学习计划 Store 暴露的动作 */
interface StudyPlanActions {
  /** 触发学习计划生成（SSE 流式） */
  generatePlan: (payload: StudyPlanRequestPayload) => Promise<StudyPlanResponse>;
  /** 标记某个知识点的学习状态 */
  markPointLearned: (stageIndex: number, pointIndex: number, status: boolean) => void;
  /** 清空学习计划状态（用于重置流程） */
  resetPlan: () => void;
}

/** 完整 Store 类型 */
type StudyPlanStore = StudyPlanState & StudyPlanActions;

export const useStudyPlanStore = create<StudyPlanStore>((set) => ({
  planData: null,
  learnedPoints: {},
  isLoading: false,
  error: null,

  generatePlan: async (payload) => {
    set({ isLoading: true, error: null });
    let latestPlanData: StudyPlanResponse | null = null;

    try {
      await fetchStudyPlan(payload, {
        // 每次收到 result 事件都同步覆盖为后端最新完整数据
        onData: (data) => {
          latestPlanData = data;
          set({ planData: data, error: null });
        },
        onError: (errorMessage) => {
          set({ error: errorMessage });
        },
      });
      if (!latestPlanData) {
        throw new Error('学习计划返回为空');
      }
      return latestPlanData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '学习计划生成失败';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  markPointLearned: (stageIndex, pointIndex, status) => {
    const key = `${stageIndex}-${pointIndex}`;
    set((state) => ({
      learnedPoints: {
        ...state.learnedPoints,
        [key]: status,
      },
    }));
  },

  resetPlan: () => {
    set({ planData: null, learnedPoints: {}, isLoading: false, error: null });
  },
}));

/** 对外语义化导出，便于视图层按 useStudyPlan 名称消费 */
export const useStudyPlan = useStudyPlanStore;
