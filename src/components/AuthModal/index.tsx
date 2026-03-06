import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { login as loginApi, register as registerApi } from '../../api/user/auth';
import { useAuthStore } from '../../store/useAuthStore';

type AuthMode = 'login' | 'register';

const AuthModal: FC = () => {
  const applyLogin = useAuthStore((s) => s.login);
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? '欢迎回来，继续你的学习旅程' : '创建账号，开启智能学习'),
    [mode],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('用户名和密码不能为空');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        await registerApi({ username, password });
        setMode('login');
      } else {
        const response = await loginApi({ username, password });
        const token = response?.data?.token;
        if (!token) {
          throw new Error('登录响应缺少 token');
        }
        applyLogin(token, username);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '鉴权失败，请稍后重试';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(255, 253, 244, 0.96), rgba(250, 246, 241, 0.94))',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 'min(520px, calc(100vw - 48px))',
          borderRadius: 24,
          padding: 32,
          backgroundColor: 'var(--bg-canvas)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 28, color: 'var(--text-heading, #BE8944)' }}>Auth Gateway</h2>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</p>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            padding: 8,
            borderRadius: 9999,
            backgroundColor: 'var(--bg-canvas)',
            boxShadow: 'var(--shadow-inner)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: mode === 'login' ? 8 : 'calc(50% + 4px)',
              width: 'calc(50% - 12px)',
              height: 'calc(100% - 16px)',
              borderRadius: 9999,
              backgroundColor: 'var(--color-highlight-bg, #FDDFCA)',
              boxShadow: 'var(--shadow-soft)',
              transition: 'left 220ms ease',
            }}
          />
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              position: 'relative',
              zIndex: 1,
              height: 40,
              borderRadius: 9999,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{
              position: 'relative',
              zIndex: 1,
              height: 40,
              borderRadius: 9999,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            注册
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              borderRadius: 16,
              padding: '12px 16px',
              backgroundColor: 'var(--color-warn-bg, #FBDDD6)',
              color: 'var(--color-warn-text, #C84A2B)',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoComplete="username"
            style={{
              width: '100%',
              height: 48,
              borderRadius: 16,
              border: '1px solid transparent',
              padding: '0 16px',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-inner)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-heading, #BE8944)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 16,
              border: '1px solid transparent',
              padding: '0 16px',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-inner)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-heading, #BE8944)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            height: 48,
            border: 'none',
            borderRadius: 9999,
            backgroundColor: 'var(--text-heading, #BE8944)',
            color: 'var(--bg-canvas)',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: isSubmitting ? 'var(--shadow-soft)' : 'var(--shadow-hover)',
            opacity: isSubmitting ? 0.8 : 1,
            transition: 'box-shadow 180ms ease, opacity 180ms ease',
          }}
        >
          {isSubmitting ? '处理中...' : mode === 'login' ? '立即登录' : '立即注册'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
