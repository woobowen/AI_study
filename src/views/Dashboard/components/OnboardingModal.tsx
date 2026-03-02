import { useEffect, useState, useRef } from 'react';
import type { FC, FormEvent, CSSProperties } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useStudyPlanStore } from '../../../store/useStudyPlan';
import { fetchPretest } from '../../../api/goagents/index';
import type { PretestResponse, PretestQuestion } from '../../../api/goagents/index';
import type { StudyPlanStage } from '../../../store/useUserStore';
import type { SSEStatus } from '../../../api/sseClient';

// ========================
// 类型定义
// ========================

/** 引导弹窗表单收集的字段 */
interface OnboardingFormData {
  /** 用户年龄 */
  age: number;
  /** 目标编程语言（如 Python / Java / C++） */
  language: string;
  /** 总学习周期（单位：天） */
  duration: number;
  /** 补充说明 */
  supplements: string;
}

/** 弹窗内部步骤状态机 */
type OnboardingStep = 'form' | 'generating' | 'quiz';

// ========================
// 样式常量（遵循 8pt 网格 + 微拟态 + 零纯黑）
// ========================

/** 全屏遮罩层：毛玻璃背景 */
const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 253, 244, 0.8)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

/** 中心卡片容器 */
const cardStyle: CSSProperties = {
  width: 480,
  padding: 40,
  borderRadius: 24,
  background: 'var(--bg-surface, #ffffff)',
  boxShadow: 'var(--shadow-soft)',
};

/** 表单标题 */
const titleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 32,
  textAlign: 'center',
};

/** 表单字段组 */
const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 24,
};

/** 标签文本 */
const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-secondary, #7a6a5a)',
};

/** 通用输入框 / 下拉框样式 */
const inputStyle: CSSProperties = {
  height: 48,
  padding: '0 16px',
  borderRadius: 16,
  border: 'none',
  background: 'var(--bg-sunken, #f0ebe4)',
  boxShadow: 'var(--shadow-inner)',
  fontSize: 16,
  color: 'var(--text-primary)',
  outline: 'none',
};

/** 补充说明文本域 */
const textareaStyle: CSSProperties = {
  ...inputStyle,
  height: 80,
  padding: 16,
  resize: 'none',
};

/** 提交按钮 */
const buttonStyle: CSSProperties = {
  width: '100%',
  height: 48,
  marginTop: 8,
  borderRadius: 16,
  border: 'none',
  background: 'var(--color-accent-fg, #6d28d9)',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-soft)',
  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
};

/** 加载界面容器 */
const generatingContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 32,
  padding: 48,
};

/** 加载提示文字（带呼吸动画） */
const loadingTextStyle: CSSProperties = {
  fontSize: 16,
  color: 'var(--text-secondary, #7a6a5a)',
  textAlign: 'center',
  animation: 'onboarding-breathe 2s ease-in-out infinite',
};

/** 学前测占位区容器 */
const quizPlaceholderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  padding: 48,
  fontSize: 18,
  color: 'var(--text-secondary, #7a6a5a)',
  textAlign: 'center',
};

/** 答题卡片顶部进度条容器 */
const quizProgressStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-tertiary, #a89888)',
  textAlign: 'right',
  marginBottom: 8,
};

/** 题干文本样式 */
const quizStemStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.6,
  marginBottom: 24,
};

/** 选项按钮容器 */
const quizOptionsContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginBottom: 32,
};

/** 单个选项按钮基础样式（毛玻璃风格） */
const quizOptionBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  padding: 16,
  borderRadius: 16,
  border: '2px solid transparent',
  background: 'var(--bg-sunken, #f0ebe4)',
  boxShadow: 'var(--shadow-inner)',
  fontSize: 16,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'left' as const,
};

/** 选项选中高亮样式（覆盖基础样式） */
const quizOptionSelectedStyle: CSSProperties = {
  ...quizOptionBaseStyle,
  border: '2px solid var(--color-accent-fg, #6d28d9)',
  background: 'rgba(109, 40, 217, 0.08)',
  boxShadow: '0 0 0 1px var(--color-accent-fg, #6d28d9)',
};

/** 选项标识（A/B/C/D）圆圈样式 */
const quizOptionLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'var(--bg-surface, #ffffff)',
  boxShadow: 'var(--shadow-soft)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-secondary, #7a6a5a)',
  flexShrink: 0,
};

// ========================
// CSS 关键帧注入（Spinner 旋转 + 文字呼吸）
// ========================

const KEYFRAMES_ID = 'onboarding-modal-keyframes';

/** 确保关键帧样式只注入一次 */
function injectKeyframes(): void {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = [
    '@keyframes onboarding-spin {',
    '  0%   { transform: rotate(0deg); }',
    '  100% { transform: rotate(360deg); }',
    '}',
    '@keyframes onboarding-breathe {',
    '  0%, 100% { opacity: 0.5; }',
    '  50%      { opacity: 1; }',
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

// ========================
// 组件主体
// ========================

/**
 * OnboardingModal — 用户画像引导弹窗
 *
 * 三阶段状态机：
 * 1. form       — 收集用户画像表单
 * 2. generating — 调用 fetchPretest SSE 流式生成学前测，展示加载动画
 * 3. quiz       — 学前测题目渲染区（当前为占位）
 *
 * 全屏绝对定位，毛玻璃遮罩拦截用户操作。
 */
const OnboardingModal: FC = () => {
  /* 注入 CSS 关键帧 */
  injectKeyframes();

  /* 从 Store 获取写入方法 */
  const updateProfile = useUserStore((s) => s.updateProfile);
  const setHasStudyPlan = useUserStore((s) => s.setHasStudyPlan);
  const setStudyPlan = useUserStore((s) => s.setStudyPlan);
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);
  const addMasteredNode = useUserStore((state) => state.addMasteredNode);
  const masteredKnowledge = useUserStore((state) => state.mastered_knowledge);
  const generatePlan = useStudyPlanStore((s) => s.generatePlan);

  /* ---- 状态机 ---- */
  /** 当前步骤 */
  const [step, setStep] = useState<OnboardingStep>('form');
  /** 加载阶段的提示文字 */
  const [loadingText, setLoadingText] = useState<string>('正在连接 AI 大脑...');
  /** 学前测结果数据（原始响应，保留备用） */
  const [pretestData, setPretestData] = useState<PretestResponse | null>(null);
  /** 学前测题目数组 */
  const [questions, setQuestions] = useState<PretestQuestion[]>([]);
  /** 当前正在作答的题目索引（从 0 开始） */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  /** 用户已选择的答案记录，key 为题目索引，value 为选项文本 */
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  /** 当前题目的元认知自信度（进入下一题前必须选择） */
  const [confidence, setConfidence] = useState<'我会' | '我不确定' | '我不会' | null>(null);

  /* 用于手动取消 SSE 请求 */
  const abortRef = useRef<AbortController | null>(null);

  /* 本地表单状态 */
  const [form, setForm] = useState<OnboardingFormData>({
    age: 14,
    language: 'Python',
    duration: 7,
    supplements: '',
  });

  /** 通用字段更新 */
  const handleChange = (
    field: keyof OnboardingFormData,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 提交表单：
   * 1. 将画像写入 Store
   * 2. 切换到 generating 步骤
   * 3. 将 Store 画像精准映射为 GoAgents 要求的扁平化字段后调用 fetchPretest
   *    - duration 直接透传为学习周期字符串
   *    - supplements → profile_text
   *    - gender 当前表单未收集，暂设为空字符串
   *    - 严禁嵌套在 userProfile 中，严禁臆想 subject / context 等字段
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    /* 统一提取并规整字段，避免表单脏值直接下发 */
    const age = Math.max(0, Number(form.age) || 0);
    const gender = '';
    const language = String(form.language).trim();
    const rawDuration = String(form.duration).trim();
    const duration = rawDuration.endsWith('天') ? rawDuration : `${rawDuration}天`;

    /* 前端边界防御：学习周期不能超过 30 天 */
    if ((Number.parseInt(rawDuration, 10) || 0) > 30) {
      alert('学习周期不能超过 30 天');
      return;
    }

    /* 步骤一：更新全局画像 */
    updateProfile({
      age,
      language,
      duration,
      supplements: form.supplements,
    });

    /* 步骤二：进入加载态 */
    setStep('generating');
    setLoadingText('正在连接 AI 大脑...');

    /* 步骤三：将表单数据精准映射为 GoAgents 扁平化请求体 */
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await fetchPretest(
        {
          /* ---- GoAgents 画像扁平化一级字段（画像结构铁律） ---- */
          age,
          gender,
          language,
          duration,
          profile_text: form.supplements || '',
          /* ---- 业务参数 ---- */
          question_count: 10,
        },
        {
          /** 流状态变更：running 时更新提示文字 */
          onStatus: (status: SSEStatus) => {
            if (status === 'running') {
              setLoadingText('AI 正在为你量身定制学前测题目...');
            }
          },

          /**
           * 收到学前测结果数据：
           * 经 sseClient 解包后，data 的结构应为 { questions: [...] }。
           * 后端题目字段可能是 stem（实际）或 question（类型定义），需兼容处理。
           * 添加 try-catch 防御，避免解析异常导致 UI 死锁。
           */
          onData: (data: PretestResponse) => {
            try {
              console.log('[OnboardingModal] onData 收到原始数据:', JSON.stringify(data));
              setPretestData(data);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const raw = data as any;
              const qs: PretestQuestion[] = (
                raw?.questions ??
                raw?.data?.questions ??
                []
              ).map((q: Record<string, unknown>) => ({
                ...q,
                question: q.question ?? q.stem ?? '',
              }));

              console.log('[OnboardingModal] 解析得到题目数量:', qs.length);

              if (qs.length > 0) {
                setQuestions(qs);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setConfidence(null);
                setStep('quiz');
              }
            } catch (err) {
              console.error('[OnboardingModal] onData 解析异常:', err, '原始数据:', data);
              setStep('form');
              alert('题目数据解析失败，请重试');
            }
          },

          /**
           * 流正常结束回调。
           * 数据解析和步骤切换已由 onData 完成，错误恢复已由 catch 处理。
           * 此处仅做无副作用的日志记录，绝对不能覆盖 step 状态，
           * 否则会因 React 闭包陷阱导致竞态覆盖 onData 的 setStep('quiz')。
           */
          onComplete: () => {
            console.log('[OnboardingModal] SSE 流彻底结束');
          },

          /** 流出错回调：记录日志（实际恢复逻辑统一在 catch 中处理） */
          onError: (errorMessage: string) => {
            console.error('[OnboardingModal] SSE 错误:', errorMessage);
          },
        },
        controller.signal,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '未知错误';
      setStep('form');
      alert(`AI 生成失败: ${msg}`);
    }
  };

  // ========================
  // 视图渲染：根据 step 切换
  // ========================

  /** 表单阶段 */
  const renderForm = () => (
    <form style={cardStyle} onSubmit={handleSubmit}>
      <h2 style={titleStyle}>完善你的学习档案</h2>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>年龄</label>
        <input
          type="number"
          min={1}
          max={120}
          value={form.age}
          onChange={(e) => handleChange('age', Number(e.target.value))}
          style={inputStyle}
          placeholder="请输入你的年龄"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>目标编程语言</label>
        <input
          type="text"
          value={form.language}
          onChange={(e) => handleChange('language', e.target.value)}
          style={inputStyle}
          placeholder="例如：Python, Java, C++"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>总学习周期</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            type="number"
            min={1}
            max={30}
            value={form.duration}
            onChange={(e) => handleChange('duration', Number(e.target.value))}
            style={{ ...inputStyle, flex: 1 }}
          />
          <span
            style={{
              fontSize: 16,
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          >
            天
          </span>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>学习目标和补充信息</label>
        <textarea
          value={form.supplements}
          onChange={(e) => handleChange('supplements', e.target.value)}
          style={textareaStyle}
          placeholder="我想学完python的基础内容，我数学能力强，编程能力弱"
        />
      </div>

      <button type="submit" style={buttonStyle}>
        开始学习之旅
      </button>
    </form>
  );

  /** 加载阶段：Spinner + 呼吸文字 */
  const renderGenerating = () => (
    <div style={cardStyle}>
      <div style={generatingContainerStyle}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            border: '4px solid var(--bg-sunken, #f0ebe4)',
            borderTopColor: 'var(--color-accent-fg, #6d28d9)',
            animation: 'onboarding-spin 0.8s linear infinite',
          }}
        />
        <p style={loadingTextStyle}>{loadingText}</p>
      </div>
    </div>
  );

  /** 选择某个选项（记录选项文本） */
  const handleSelectOption = (optionText: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionText }));
  };

  /** 统一收敛测验结束后的学习计划触发逻辑（正常完成与熔断结束共用） */
  const handleFinishQuiz = async (): Promise<void> => {
    // 进入学习计划生成态，复用现有加载动画并阻断重复点击
    setStep('generating');
    setLoadingText('AI 正在生成你的个性化学习计划...');

    const answeredCount = Object.keys(selectedAnswers).length;
    let finalProfileText = `${form.supplements || ''}\n[学前测进度] 已答 ${answeredCount} / ${questions.length} 题`;
    if (masteredKnowledge && masteredKnowledge.length > 0) {
      // 将图谱节点改为带序号列表，提升后端对掌握内容的解析稳定性
      const masteredListText = masteredKnowledge
        .map((item, index) => `${index + 1}. ${item}`)
        .join('；');
      finalProfileText += `\n\n[系统动态图谱] 该用户已确切掌握以下知识点：${masteredListText}。请严格避开上述已掌握基础，优先生成更高阶、更具挑战性的学习内容与题目。`;
    }

    const studyPlanPayload = {
      age: Math.max(0, Number(form.age) || 0),
      gender: '',
      language: String(form.language).trim(),
      // 注意：duration 在最新契约中表示“总学习周期”
      duration: String(form.duration).trim().endsWith('天')
        ? String(form.duration).trim()
        : `${String(form.duration).trim()}天`,
      // 统一使用视图层水合后的画像文本，避免底层 API 覆写
      profile_text: finalProfileText.trim(),
    };

    try {
      const res = await generatePlan(studyPlanPayload);
      const rawRes = res as unknown as { stages?: unknown; data?: { stages?: unknown } };
      // 兼容历史返回差异：优先 stages，其次降级兼容 data.stages
      const parsedStages = Array.isArray(rawRes.stages)
        ? (rawRes.stages as StudyPlanStage[])
        : Array.isArray(rawRes.data?.stages)
          ? (rawRes.data?.stages as StudyPlanStage[])
          : [];

      setStudyPlan(parsedStages);
      setHasStudyPlan(true);
      updateProfile({
        profile_summary: form.supplements.trim() || '已完成学前测，待系统持续更新画像摘要',
      });
      // 成功后立刻标记完成，引导弹窗由上层状态卸载
      setHasCompletedOnboarding(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '未知错误';
      console.error('[OnboardingModal] 学习计划生成失败:', error);
      // 失败时回退到答题态，允许用户重试
      setStep('quiz');
      alert(`学习计划生成失败：${msg}`);
    }
  };

  /** 点击"下一题"或"完成测验" */
  const handleNextQuestion = () => {
    const current = questions[currentQuestionIndex];
    const selected = selectedAnswers[currentQuestionIndex];
    if (!current || !selected || confidence === null) return;

    // 使用后端真实字段 answer 做正确性判定（兼容单选/多选）
    const correctAnswer =
      Array.isArray(current.answer) ? String(current.answer[0] ?? '') : String(current.answer ?? '');
    // 采用前缀匹配，兼容后端在答案后追加解释文本的场景
    const isCorrect = correctAnswer.startsWith(selected);
    const stemText = String((current as { stem?: string }).stem ?? current.question ?? '').trim();

    // 仅当“我会”且答对时，允许点亮图谱节点
    if (confidence === '我会' && isCorrect) {
      // 直接读取大模型精准提炼的考点标签，若遇到旧数据或缺失则 Fallback 截取题干
      const nodeLabel = String((current as any).knowledge_point || stemText.slice(0, 10));
      addMasteredNode(nodeLabel);
    }

    const isLast = currentQuestionIndex === questions.length - 1;
    if (isLast) {
      void handleFinishQuiz();
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    // 切题后强制重置自信度，避免上一题状态污染下一题
    setConfidence(null);
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestionIndex + 1];
      return next;
    });
  };

  /** 学前测答题阶段 */
  const renderQuiz = () => {
    if (questions.length === 0) {
      return (
        <div style={cardStyle}>
          <div style={quizPlaceholderStyle}>
            <p>{pretestData ? '题目解析异常，请重试' : '暂无题目数据'}</p>
          </div>
        </div>
      );
    }

    const current = questions[currentQuestionIndex];
    const total = questions.length;
    const selected = selectedAnswers[currentQuestionIndex];
    const isLast = currentQuestionIndex === total - 1;

    return (
      <div style={{ ...cardStyle, width: 544 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={quizProgressStyle}>
            {currentQuestionIndex + 1} / {total}
          </div>
          <button
            type="button"
            onClick={() => {
              void handleFinishQuiz();
            }}
            style={{
              border: '1px solid var(--color-warn-bg, #FBDDD6)',
              background: 'var(--color-warn-bg, #FBDDD6)',
              color: 'var(--color-warn-text, #C84A2B)',
              borderRadius: 9999,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            结束
          </button>
        </div>

        <div style={quizStemStyle}>
          {current.question}
        </div>

        <div style={quizOptionsContainerStyle}>
          {current.options.map((option, index) => {
            const optionText =
              typeof option === 'string' ? option : String(option?.text ?? '');
            const optionKey =
              typeof option === 'string'
                ? `${currentQuestionIndex}-${index}-${optionText}`
                : `${currentQuestionIndex}-${index}-${String(option?.label ?? optionText)}`;

            return (
              <button
                key={optionKey}
                type="button"
                style={
                  selected === optionText
                    ? quizOptionSelectedStyle
                    : quizOptionBaseStyle
                }
                onClick={() => handleSelectOption(optionText)}
              >
                <span style={quizOptionLabelStyle}>{String.fromCharCode(65 + index)}</span>
                <span>{optionText}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {(['我不会', '我不确定', '我会'] as const).map((item) => {
            const isActive = confidence === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setConfidence(item)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: '1px solid var(--code-border, #e4c8a6)',
                  background: isActive ? 'var(--text-heading, #BE8944)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selected || confidence === null}
          style={{
            ...buttonStyle,
            opacity: selected && confidence !== null ? 1 : 0.5,
            pointerEvents: selected && confidence !== null ? 'auto' : 'none',
          }}
          onClick={handleNextQuestion}
        >
          {isLast ? '完成测验' : '下一题'}
        </button>
      </div>
    );
  };

  // 题目变化时重置自信度，确保每题都经过独立元认知判断
  useEffect(() => {
    if (step === 'quiz') {
      setConfidence(null);
    }
  }, [currentQuestionIndex, step]);

  // 🚧 [开发期后门]: 设为 true 以全局屏蔽学前测弹窗，专注其他模块开发。上线前或需要联调计划生成时改回 false。
  const DEV_BYPASS_ONBOARDING = false;
  if (DEV_BYPASS_ONBOARDING) {
    return null;
  }

  return (
    <div style={overlayStyle}>
      {step === 'form' && renderForm()}
      {step === 'generating' && renderGenerating()}
      {step === 'quiz' && renderQuiz()}
    </div>
  );
};

export default OnboardingModal;
