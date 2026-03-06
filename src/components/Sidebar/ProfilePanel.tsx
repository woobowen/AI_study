import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * 侧边栏顶部 —— 用户画像面板
 * 占据右侧栏约 30% 高度，flex-shrink: 0 防止被压缩
 */
const ProfilePanel: React.FC = () => {
  /* 从全局 Store 读取画像数据（嵌套在 userProfile 对象内） */
  const nickname = useUserStore((s) => s.userProfile?.nickname ?? '');
  const level = useUserStore((s) => s.userProfile?.level ?? 0);
  const badges = useUserStore((s) => s.userProfile?.badges ?? []);
  const logout = useAuthStore((s) => s.logout);

  return (
    <section
      className="profile-panel"
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        /* 底部分隔线 */
        borderBottom: '1px solid var(--border-default, rgba(200,200,210,0.25))',
      }}
    >
      {/* ---- 头像占位 ---- */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: 'var(--color-info-bg, #e0e5ec)',
          boxShadow: 'var(--shadow-soft, 4px 4px 8px #c8ccd0, -4px -4px 8px #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
        aria-label="用户头像占位"
      >
        🧑‍🎓
      </div>

      {/* ---- 昵称 ---- */}
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-heading, #2d3142)',
          letterSpacing: 1,
        }}
      >
        {nickname || '未设置昵称'}
      </h2>

      {/* ---- 等级标签 ---- */}
      <span
        style={{
          fontSize: 12,
          padding: '4px 16px',
          borderRadius: 16,
          background: 'var(--color-info-bg, #e0e5ec)',
          color: 'var(--text-secondary, #6b7280)',
          boxShadow: 'var(--shadow-inner, inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff)',
        }}
      >
        Lv.{level}
      </span>

      {/* ---- 成就徽章区 ---- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          marginTop: 8,
        }}
      >
        {badges.length > 0 ? (
          badges.map((badge) => (
            <span
              key={badge}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 8,
                background: 'var(--color-info-bg, #e0e5ec)',
                boxShadow: 'var(--shadow-soft, 2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff)',
              }}
            >
              {badge}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted, #9ca3af)' }}>
            暂无徽章
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={logout}
        style={{
          marginTop: 8,
          padding: '8px 16px',
          borderRadius: 9999,
          border: '1px solid transparent',
          background: 'transparent',
          color: 'var(--color-warn-text, #C84A2B)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'box-shadow 160ms ease, background-color 160ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-inner)';
          e.currentTarget.style.backgroundColor = 'var(--color-warn-bg, #FBDDD6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        [登出账号]
      </button>
    </section>
  );
};

export default ProfilePanel;
