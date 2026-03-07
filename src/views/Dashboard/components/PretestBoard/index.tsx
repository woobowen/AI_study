import { useMemo, useState } from 'react';
import type { FC } from 'react';
import type { StudyPlanRequestPayload, StudyPlanResponse } from '../../../../api/goagents';
import { fetchPretestQuestions } from '../../../../api/goagents/pretest';
import { generateStudyPlan } from '../../../../api/goagents/studyplan';
import { useStudyPlan } from '../../../../store/useStudyPlan';
import { useUserStore } from '../../../../store/useUserStore';

type PretestStatus = 'intro' | 'loading_questions' | 'testing' | 'generating';
type ConfidenceLevel = '我会' | '我不确定' | '我不会';

interface LocalQuestion {
  id: string;
  question: string;
  options: string[];
  knowledge_point: string;
  correct_answer: string;
}

const boardWrapStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  padding: 32,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-canvas)',
};

const boardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 880,
  borderRadius: 24,
  padding: 32,
  boxSizing: 'border-box',
  background: 'var(--bg-canvas)',
  boxShadow: 'var(--shadow-soft)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: '36px',
  color: 'var(--text-heading)',
};

const subTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--text-secondary, #7a6a5a)',
};

const actionButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 16,
  height: 48,
  padding: '0 32px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  color: '#ffffff', // 强制纯白字体
  backgroundColor: 'var(--text-heading, #BE8944)', // 强制高对比度主题色背景
  boxShadow: 'var(--shadow-hover)',
  transition: 'all 0.2s ease',
};

const capsuleBaseStyle: React.CSSProperties = {
  borderRadius: 9999,
  border: '1px solid transparent',
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px',
  cursor: 'pointer',
};

const confidenceStyles: Record<ConfidenceLevel, { active: React.CSSProperties; inactive: React.CSSProperties }> = {
  我会: {
    active: {
      background: 'var(--color-success-bg, #effce3)',
      borderColor: 'var(--color-success-border, #c7e7aa)',
      color: 'var(--color-success-text, #478211)',
    },
    inactive: {
      background: 'transparent',
      borderColor: 'var(--color-success-border, #c7e7aa)',
      color: 'var(--color-success-text, #478211)',
    },
  },
  我不确定: {
    active: {
      background: 'var(--color-warning-bg, #fef4e0)',
      borderColor: 'var(--color-warning-fg, #b45309)',
      color: 'var(--color-warning-fg, #b45309)',
    },
    inactive: {
      background: 'transparent',
      borderColor: 'var(--color-warning-fg, #b45309)',
      color: 'var(--color-warning-fg, #b45309)',
    },
  },
  我不会: {
    active: {
      background: 'var(--color-error-bg, #fde8e8)',
      borderColor: 'var(--color-error-fg, #c81e1e)',
      color: 'var(--color-error-fg, #c81e1e)',
    },
    inactive: {
      background: 'transparent',
      borderColor: 'var(--color-error-fg, #c81e1e)',
      color: 'var(--color-error-fg, #c81e1e)',
    },
  },
};

function toProfilePayload(userProfile: ReturnType<typeof useUserStore.getState>['userProfile']): StudyPlanRequestPayload {
  return {
    age: Number(userProfile.age) || 0,
    gender: '',
    language: String(userProfile.language || '').trim(),
    duration: String(userProfile.duration || '').trim(),
    profile_text: String(userProfile.supplements || userProfile.profile_summary || '').trim(),
  };
}

function normalizeQuestions(rawQuestions: unknown): LocalQuestion[] {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions
    .map((raw, index) => {
      const record = raw as Record<string, unknown>;
      const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `q_${index + 1}`;
      const questionRaw =
        typeof record.question === 'string'
          ? record.question
          : typeof record.stem === 'string'
            ? record.stem
            : '';
      const question = questionRaw.trim();

      const optionsRaw = Array.isArray(record.options) ? record.options : [];
      const options = optionsRaw
        .map((item) => {
          if (typeof item === 'string') {
            return item.trim();
          }
          if (item && typeof item === 'object') {
            const option = item as Record<string, unknown>;
            const label = typeof option.label === 'string' ? option.label.trim() : '';
            const text = typeof option.text === 'string' ? option.text.trim() : '';
            if (label && text) {
              return `${label}. ${text}`;
            }
            return text;
          }
          return '';
        })
        .filter((item): item is string => Boolean(item));
      if (!question || options.length === 0) {
        return null;
      }

      return {
        id,
        question,
        options,
        // 安全提取底层知识点和正确答案
        knowledge_point:
          typeof record.knowledge_point === 'string'
            ? record.knowledge_point
            : typeof record.tag === 'string'
              ? record.tag
              : '未分类知识点',
        correct_answer: typeof record.answer === 'string' ? record.answer : '',
      };
    })
    .filter((item): item is LocalQuestion => Boolean(item));
}

const PretestBoard: FC = () => {
  const setPlanData = useStudyPlan((s) => s.setPlanData);
  const setUserStudyPlan = useUserStore((s) => s.setStudyPlan);
  const setHasStudyPlan = useUserStore((s) => s.setHasStudyPlan);
  const completePretest = useUserStore((s) => s.completePretest);
  const userProfile = useUserStore((s) => s.userProfile);

  const [status, setStatus] = useState<PretestStatus>('intro');
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidenceMap, setConfidenceMap] = useState<Partial<Record<string, ConfidenceLevel>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questions && questions.length > 0 && questionIndex === questions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentConfidence = currentQuestion ? confidenceMap[currentQuestion.id] : undefined;

  const canProceed = useMemo(
    () => Boolean(currentAnswer && currentConfidence),
    [currentAnswer, currentConfidence],
  );

  const loadQuestions = async () => {
    setErrorMessage(null);
    setQuestionIndex(0);
    setAnswers({});
    setConfidenceMap({});
    setQuestions([]);
    setStatus('loading_questions');

    let latestQuestions: LocalQuestion[] = [];

    try {
      await fetchPretestQuestions(
        {
          ...toProfilePayload(userProfile),
        },
        {
          onData: (payload) => {
            const normalized = normalizeQuestions(payload.questions);
            if (normalized.length > 0) {
              latestQuestions = normalized;
              setQuestions(normalized);
            }
          },
          onError: (message) => {
            setErrorMessage(message);
          },
        },
      );

      if (!latestQuestions.length) {
        throw new Error('未获取到有效考题，请重试');
      }

      setStatus('testing');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '加载考题失败';
      setErrorMessage(message);
      setStatus('intro');
    }
  };

  const submitForPlan = async () => {
    setErrorMessage(null);
    setStatus('generating');

    const answeredQuestions = questions
      .slice(0, questionIndex + (canProceed ? 1 : 0))
      .filter((q) => answers[q.id] && confidenceMap[q.id]);

    const base = toProfilePayload(userProfile);
    // 1. 过滤出真正“已掌握”的题目
    // 判定铁律：用户明确表示“我会” 且 用户的作答选项与正确答案匹配（采用前缀匹配防止解析干扰）
    const masteredQuestions = answeredQuestions.filter((q) => {
      const isConfident = confidenceMap[q.id] === '我会';
      const userAnswer = String(answers[q.id] || '').trim();
      const isCorrect = q.correct_answer && userAnswer && q.correct_answer.startsWith(userAnswer);
      return isConfident && isCorrect;
    });

    // 2. 提取底层知识点
    const masteredPoints = masteredQuestions.map((q) => q.knowledge_point);

    // 3. 激活全局知识图谱注水（核心防萎缩修复！）
    const { addMasteredNode } = useUserStore.getState();
    masteredPoints.forEach((kp) => addMasteredNode(kp));

    // 4. 重塑最终的 Payload 文本
    let finalProfileText = base.profile_text;
    if (masteredPoints.length > 0) {
      // 采用去重后的知识点进行组装
      const uniquePoints = Array.from(new Set(masteredPoints));
      finalProfileText = [base.profile_text, `【已掌握知识点】\n${uniquePoints.join(', ')}`].filter(Boolean).join('\n\n');
    }

    const payload: StudyPlanRequestPayload = {
      age: base.age,
      gender: base.gender,
      language: base.language,
      duration: base.duration,
      profile_text: finalProfileText,
    };

    let latestPlan: StudyPlanResponse | null = null;

    try {
      await generateStudyPlan(payload, {
        onData: (plan) => {
          if (Array.isArray(plan.stages) && plan.stages.length > 0) {
            latestPlan = plan;
          }
        },
        onError: (message) => {
          setErrorMessage(message);
        },
      });

      if (!latestPlan) {
        throw new Error('未返回可用学习计划');
      }

      const resolvedPlan: StudyPlanResponse = latestPlan;
      setPlanData(resolvedPlan);
      setUserStudyPlan(resolvedPlan.stages);
      setHasStudyPlan(true);
      completePretest();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '计划生成失败';
      setErrorMessage(message);
      setStatus('testing');
    }
  };

  const handleNextOrSubmit = () => {
    if (!currentQuestion || !canProceed) {
      return;
    }

    if (isLastQuestion) {
      void submitForPlan();
      return;
    }

    setQuestionIndex((prev) => prev + 1);
  };

  const handleEarlySubmit = () => {
    if (status !== 'testing' || questions.length === 0) {
      return;
    }

    void submitForPlan();
  };

  const shouldShowLoadingFallback =
    status === 'loading_questions' || (status === 'testing' && (!questions || questions.length === 0 || !currentQuestion));

  return (
    <section style={boardWrapStyle}>
      <style>
        {`@keyframes pretest-board-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes pretest-board-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }`}
      </style>

      <article style={boardStyle}>
        {status === 'intro' && (
          <>
            <h2 style={headingStyle}>微拟态学前测 · PretestBoard</h2>
            <p style={subTextStyle}>测验将用于生成你的 7 天 Python 专属学习路线，预计用时约 2 分钟。</p>
            {errorMessage && (
              <p style={{ ...subTextStyle, color: 'var(--color-error-fg, #c81e1e)' }}>{errorMessage}</p>
            )}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                type="button"
                style={actionButtonStyle}
                onClick={() => {
                  void loadQuestions();
                }}
              >
                开始测验
              </button>
            </div>
          </>
        )}

        {shouldShowLoadingFallback && (
          <div
            style={{
              minHeight: 296,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '3px solid var(--code-border, #e4c8a6)',
                borderTopColor: 'var(--text-heading)',
                animation: 'pretest-board-spin 0.8s linear infinite',
              }}
            />
            <p
              style={{
                ...subTextStyle,
                margin: 0,
                textAlign: 'center',
                animation: 'pretest-board-breathe 2s ease-in-out infinite',
              }}
            >
              正在联系 AI 引擎生成专属考题...
            </p>
          </div>
        )}

        {status === 'testing' && currentQuestion && questions.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <h2 style={{ ...headingStyle, fontSize: 24, lineHeight: '32px' }}>学前测验进行中</h2>
              <span style={{ fontSize: 14, color: 'var(--text-secondary, #7a6a5a)' }}>
                {questionIndex + 1} / {questions.length}
              </span>
            </div>

            {errorMessage && (
              <p style={{ ...subTextStyle, color: 'var(--color-error-fg, #c81e1e)' }}>{errorMessage}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 18, lineHeight: '28px', color: 'var(--text-primary)' }}>
                {currentQuestion.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentQuestion.options.map((option) => {
                  const selected = currentAnswer === option;
                  return (
                    <button
                      key={`${currentQuestion.id}-${option}`}
                      type="button"
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
                      }}
                      style={{
                        textAlign: 'left',
                        border: selected
                          ? '1px solid var(--text-heading)'
                          : '1px solid var(--code-border, #e4c8a6)',
                        borderRadius: 16,
                        background: selected ? 'rgba(190, 137, 68, 0.08)' : 'var(--bg-canvas)',
                        padding: '12px 16px',
                        fontSize: 15,
                        lineHeight: '24px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', fontWeight: 700, color: 'var(--text-secondary, #7a6a5a)' }}>
                置信度拦截器（必选）
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(['我会', '我不确定', '我不会'] as const).map((item) => {
                  const isActive = currentConfidence === item;
                  const stateStyle = isActive ? confidenceStyles[item].active : confidenceStyles[item].inactive;
                  return (
                    <button
                      key={item}
                      type="button"
                      style={{ ...capsuleBaseStyle, ...stateStyle }}
                      onClick={() => {
                        setConfidenceMap((prev) => ({ ...prev, [currentQuestion.id]: item }));
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button
                type="button"
                onClick={handleEarlySubmit}
                style={{
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 16,
                  border: '2px solid var(--text-heading, #BE8944)',
                  background: 'transparent',
                  color: 'var(--text-heading, #BE8944)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                提前结束并生成计划
              </button>

              <button
                type="button"
                onClick={handleNextOrSubmit}
                disabled={!canProceed}
                style={{
                  ...actionButtonStyle,
                  opacity: canProceed ? 1 : 0.45,
                  pointerEvents: canProceed ? 'auto' : 'none',
                }}
              >
                {isLastQuestion ? '提交并生成专属计划' : '下一题'}
              </button>
            </div>
          </>
        )}

        {status === 'generating' && (
          <div
            style={{
              minHeight: 296,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '3px solid var(--code-border, #e4c8a6)',
                borderTopColor: 'var(--text-heading)',
                animation: 'pretest-board-spin 0.8s linear infinite',
              }}
            />
            <p
              style={{
                ...subTextStyle,
                margin: 0,
                textAlign: 'center',
                animation: 'pretest-board-breathe 2s ease-in-out infinite',
              }}
            >
              AI 正在基于你的画像与答题数据，流式编排专属学习路线...
            </p>
            {errorMessage && (
              <p style={{ ...subTextStyle, color: 'var(--color-error-fg, #c81e1e)' }}>{errorMessage}</p>
            )}
          </div>
        )}
      </article>
    </section>
  );
};

export default PretestBoard;
