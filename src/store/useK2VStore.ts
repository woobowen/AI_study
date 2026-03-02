import { create } from 'zustand';
import { getK2VVideoUrl } from '../api/k2v';
import type { GenerateVideoSSECallbacks, GenerateVideoSSEParams } from '../api/k2v';

/** K2V 生成任务 API 调用函数签名 */
type K2VGenerationApiCall = (
  payload: GenerateVideoSSEParams,
  callbacks: GenerateVideoSSECallbacks,
) => Promise<void>;

/** K2V 生成流程全局状态 */
interface K2VState {
  /** 是否处于生成中 */
  isGenerating: boolean;
  /** 生成进度（0-100） */
  progress: number;
  /** 生成阶段文案 */
  loadingText: string;
  /** 最终视频地址 */
  videoUrl: string;
  /** 输入知识点 */
  inputText: string;
  /** 当前难度 */
  difficulty: 'simple' | 'medium' | 'hard';
}

/** K2V Store 对外动作 */
interface K2VActions {
  /** 设置生成状态 */
  setGenerating: (status: boolean) => void;
  /** 设置进度 */
  setProgress: (val: number) => void;
  /** 设置加载文案 */
  setLoadingText: (text: string) => void;
  /** 设置视频地址 */
  setVideoUrl: (url: string) => void;
  /** 设置输入知识点 */
  setInputText: (text: string) => void;
  /** 设置难度 */
  setDifficulty: (difficulty: 'simple' | 'medium' | 'hard') => void;
  /** 重置状态 */
  reset: () => void;
  /** 启动生成任务（内置虚拟进度与回调编排） */
  startGeneration: (payload: GenerateVideoSSEParams, apiCall: K2VGenerationApiCall) => Promise<void>;
}

type K2VStore = K2VState & K2VActions;

/** 统一初始状态，确保 reset 与首次加载一致 */
const INITIAL_STATE: K2VState = {
  isGenerating: false,
  progress: 0,
  loadingText: 'AI 正在生成视频...',
  videoUrl: '',
  inputText: '',
  difficulty: 'simple',
};

/** K2V 全局状态中枢 */
export const useK2VStore = create<K2VStore>((set, get) => ({
  ...INITIAL_STATE,

  setGenerating: (status) => {
    set({ isGenerating: status });
  },

  setProgress: (val) => {
    const next = Math.min(100, Math.max(0, Math.floor(val)));
    set({ progress: next });
  },

  setLoadingText: (text) => {
    set({ loadingText: text });
  },

  setVideoUrl: (url) => {
    set({ videoUrl: url });
  },

  setInputText: (text) => {
    set({ inputText: text });
  },

  setDifficulty: (difficulty) => {
    set({ difficulty });
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },

  startGeneration: async (payload, apiCall) => {
    get().reset();
    set({ isGenerating: true, progress: 1, loadingText: '正在提交生成任务...' });

    // 以低速虚拟进度承接后端长耗时阶段，避免界面长时间无反馈
    const timer: ReturnType<typeof setInterval> = setInterval(() => {
      const current = get().progress;
      if (current >= 95) return;
      set({ progress: Math.min(95, current + 1) });
    }, 2000);

    const clearTimer = (): void => {
      clearInterval(timer);
    };

    try {
      await apiCall(payload, {
        onRunning: (message) => {
          set({ loadingText: message || 'AI 正在生成视频...' });
        },
        onResult: (videoFile, message) => {
          clearTimer();
          set({
            progress: 100,
            loadingText: message || '视频资源已就绪',
            videoUrl: videoFile ? getK2VVideoUrl(videoFile) : '',
          });
        },
        onFinished: (message) => {
          clearTimer();
          set({
            loadingText: message || '视频生成完成',
            isGenerating: false,
          });
        },
        onFailed: (message) => {
          clearTimer();
          set({
            loadingText: message || '视频生成失败',
            isGenerating: false,
          });
        },
        onError: (message) => {
          clearTimer();
          set({
            loadingText: message || '生成过程出现异常',
            isGenerating: false,
          });
        },
      });
    } catch (error: unknown) {
      clearTimer();
      const message = error instanceof Error ? error.message : '生成过程出现异常';
      set({ loadingText: message, isGenerating: false });
      throw error instanceof Error ? error : new Error(message);
    } finally {
      clearTimer();
    }
  },
}));
