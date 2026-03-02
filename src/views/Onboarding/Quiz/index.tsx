import { useState } from 'react';
import type { FC } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchPersonalProfile } from '../../../api/goagents';
import { useUserStore } from '../../../store/useUserStore';

/** Quiz 结果页：将答题文本提交给大模型生成 personal_profile */
const QuizResultPage: FC = () => {
  const navigate = useNavigate();
  const userProfile = useUserStore((s) => s.userProfile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);

  const [answerText, setAnswerText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (hasCompletedOnboarding) {
    return <Navigate to="/" replace />;
  }

  /** 提交答题结果并生成画像摘要 */
  const handleSubmit = async (): Promise<void> => {
    if (!answerText.trim()) {
      alert('请先填写学前测结果摘要');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchPersonalProfile(
        {
          age: Math.max(0, Number(userProfile.age) || 0),
          gender: '',
          language: String(userProfile.language || 'Python'),
          duration: String(userProfile.duration || '7天'),
          profile_text: String(userProfile.supplements || ''),
          answers: [answerText.trim()],
        },
        {
          onData: (data) => {
            const summary = String(data.personal_profile ?? '').trim();
            if (summary) {
              updateProfile({ profile_summary: summary });
            }
          },
        },
      );

      setHasCompletedOnboarding(true);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '画像生成失败';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 32,
          borderRadius: 24,
          background: '#FFFFFF',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 24, color: 'var(--text-primary)' }}>
          学前测结果提交
        </h2>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="请输入你的学前测答题摘要，用于生成 personal_profile"
          style={{
            width: '100%',
            minHeight: 160,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            padding: 16,
            borderRadius: 16,
            boxShadow: 'var(--shadow-inner)',
            background: 'var(--bg-canvas)',
            boxSizing: 'border-box',
            color: 'var(--text-primary)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            style={{
              border: 'none',
              borderRadius: 16,
              padding: '8px 24px',
              background: 'var(--text-heading)',
              color: '#FFFFFF',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.72 : 1,
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            {isSubmitting ? '生成中...' : '提交并生成画像'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;
