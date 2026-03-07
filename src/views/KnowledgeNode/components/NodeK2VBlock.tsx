import { useState, useEffect, type FC } from 'react';
import { useUserStore } from '../../../store/useUserStore';

export const NodeK2VBlock: FC<{ knowledgePoint: string }> = ({ knowledgePoint }) => {
  const [status, setStatus] = useState<'running' | 'finished' | 'failed'>('running');
  const userProfile = useUserStore((state) => state.userProfile);

  useEffect(() => {
    const timer = setTimeout(() => setStatus('finished'), 3000);
    return () => clearTimeout(timer);
  }, [knowledgePoint, userProfile]);

  if (status === 'running') {
    return (
      <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(228, 200, 166, 0.3)', borderTopColor: 'var(--color-highlight-bg)', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>正在从高维空间降维视频流...</span>
      </article>
    );
  }

  return (
    <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🎬</span> 沉浸视界 (K2V)
      </h3>
      {/* 浅色拟态播放器占位 - 强对比度重塑 */}
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', backgroundColor: 'var(--code-bg)', border: '2px solid rgba(228, 200, 166, 0.3)', boxShadow: 'inset 0 4px 20px rgba(228, 200, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* 视觉焦点的深色播放按钮 */}
        <div 
          style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--text-heading)', boxShadow: '0 8px 24px rgba(44, 22, 8, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(44, 22, 8, 0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 22, 8, 0.25)'; }}
        >
          {/* 镂空的浅色播放三角 */}
          <div style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '24px solid var(--bg-canvas)', marginLeft: '8px' }} />
        </div>
      </div>
    </article>
  );
};
