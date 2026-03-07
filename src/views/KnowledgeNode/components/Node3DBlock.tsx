import { useState, useEffect, type FC } from 'react';
import { useUserStore } from '../../../store/useUserStore';

export const Node3DBlock: FC<{ knowledgePoint: string }> = ({ knowledgePoint }) => {
  const [status, setStatus] = useState<'running' | 'finished' | 'failed'>('running');
  const userProfile = useUserStore((state) => state.userProfile);

  useEffect(() => {
    const timer = setTimeout(() => setStatus('finished'), 3000);
    return () => clearTimeout(timer);
  }, [knowledgePoint, userProfile]);

  if (status === 'running') {
    return (
      <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(228, 200, 166, 0.3)', borderTopColor: 'var(--color-success-bg)', animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>正在构建 3D 具身交互沙盒...</span>
      </article>
    );
  }

  return (
    <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🧊</span> 具身交互 (3D Sandbox)
        </h3>
        <span style={{ padding: '4px 12px', borderRadius: '999px', backgroundColor: 'var(--color-highlight-bg)', color: 'var(--color-highlight-text)', fontSize: '12px', fontWeight: 700 }}>可交互</span>
      </div>
      {/* 修复坍缩，强制 450px 高度与透视网格背景 */}
      <div style={{ width: '100%', height: '450px', borderRadius: '16px', background: 'radial-gradient(circle at center, rgba(228, 200, 166, 0.1) 0%, transparent 70%), var(--code-bg)', border: '1px solid var(--code-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(228, 200, 166, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 200, 166, 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500, zIndex: 1 }}>[ 3D WebGL 渲染引擎待命 ]</span>
      </div>
    </article>
  );
};
