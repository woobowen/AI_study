import type { FC } from 'react';

/**
 * 功能矩阵卡片数据结构
 */
interface FeatureCard {
  /** 卡片标题 */
  title: string;
  /** 卡片简介 */
  description: string;
  /** 图标 emoji */
  icon: string;
  /** 是否为 IDE 降级卡片 */
  disabled?: boolean;
}

/** 功能矩阵 3×2 数据源 */
const FEATURE_CARDS: FeatureCard[] = [
  {
    title: '知识点大全',
    description: '结构化浏览全部知识图谱，快速定位学习目标',
    icon: '📚',
  },
  {
    title: 'K2V 视频生成',
    description: '将知识点一键转化为可视化讲解视频',
    icon: '🎬',
  },
  {
    title: 'C2V 代码解析',
    description: '上传代码片段，AI 逐行拆解运行逻辑',
    icon: '🔍',
  },
  {
    title: '3D 模型沙盒',
    description: '在三维空间中交互式探索抽象概念',
    icon: '🧊',
  },
  {
    title: '错题本',
    description: '智能归档易错题目，定期推送巩固训练',
    icon: '📝',
  },
  {
    title: '在线编程平台',
    description: '云端实时编码、运行与调试一体化环境',
    icon: '💻',
    disabled: true,
  },
];

/**
 * FeatureMatrix 功能矩阵
 * 职责：以 3×2 CSS Grid 展示平台核心功能入口卡片
 * 第 6 张卡片（在线编程平台）强制降级封印
 */
const FeatureMatrix: FC = () => {
  return (
    <section>
      {/* 区块标题 */}
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 24,
        }}
      >
        功能矩阵
      </h2>

      {/* 3×2 网格容器 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32,
        }}
      >
        {FEATURE_CARDS.map((card) => (
          <div
            key={card.title}
            className={card.disabled ? 'card-disabled-ide' : undefined}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 32,
              minHeight: 200,
              borderRadius: 16,
              background: card.disabled
                ? undefined
                : 'rgba(255, 255, 255, 0.72)',
              boxShadow: card.disabled ? undefined : 'var(--shadow-soft)',
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              cursor: card.disabled ? undefined : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!card.disabled) {
                const el = e.currentTarget;
                el.style.boxShadow = 'var(--shadow-hover)';
                el.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!card.disabled) {
                const el = e.currentTarget;
                el.style.boxShadow = 'var(--shadow-soft)';
                el.style.transform = 'translateY(0)';
              }
            }}
          >
            {/* 图标 */}
            <span style={{ fontSize: 40, lineHeight: 1 }}>{card.icon}</span>

            {/* 标题 */}
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {card.title}
            </span>

            {/* 简介 */}
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              {card.description}
            </span>

            {/* IDE 降级 Badge — 绝对定位正中央 */}
            {card.disabled && (
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  padding: '8px 24px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--text-primary)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  letterSpacing: 1,
                  pointerEvents: 'none',
                }}
              >
                🚧 即将上线
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureMatrix;
