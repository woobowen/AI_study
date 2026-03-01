import type { FC } from 'react';

/**
 * HeroSearch 顶部搜索区
 * 职责：展示主标题 + 内凹搜索框，供用户快速检索学习内容
 */
const HeroSearch: FC = () => {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* 主标题 — 居中 + 大字号 + 微拟态文字阴影 */}
      <h1
        style={{
          margin: 0,
          fontSize: 48,
          fontWeight: 800,
          color: 'var(--text-heading)',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(62, 44, 28, 0.08)',
        }}
      >
        AI编程学习助手
      </h1>

      {/* 内凹搜索框 */}
      <input
        type="text"
        placeholder="搜索课程、知识点或学习计划…"
        style={{
          width: '100%',
          height: 56,
          padding: '0 24px',
          border: 'none',
          borderRadius: 16,
          backgroundColor: 'rgba(228, 200, 166, 0.15)',
          boxShadow: 'var(--shadow-inner)',
          fontSize: 16,
          color: 'var(--text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </section>
  );
};

export default HeroSearch;
