import type { FC } from 'react';

/** Mock 每日计划数据 */
const MOCK_DAYS = [
  { day: 1, title: 'Python 基础语法' },
  { day: 2, title: '条件与循环' },
  { day: 3, title: '函数与模块' },
  { day: 4, title: '面向对象入门' },
];

/**
 * DailyPlanGrid 每日计划卡片网格
 * 职责：以 4 列 Grid 渲染天数卡片，微凸阴影 + 24px 圆角
 * 视觉规范：卡片使用半透明白色背景，在奶油白底色上清晰浮现
 */
const DailyPlanGrid: FC = () => {
  return (
    <section
      className="daily-plan-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridAutoRows: 180,
        gap: 24,
      }}
    >
      {MOCK_DAYS.map((item) => (
        <div
          key={item.day}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            padding: 24,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: 'var(--shadow-soft)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLDivElement;
            target.style.boxShadow = 'var(--shadow-hover)';
            target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLDivElement;
            target.style.boxShadow = 'var(--shadow-soft)';
            target.style.transform = 'translateY(0)';
          }}
        >
          {/* 天数标识 - 居中显示，使用标题色 */}
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--text-heading)',
              textAlign: 'center',
            }}
          >
            Day {item.day}
          </span>

          {/* 简要描述 - 颜色稍浅，使用次要文本色 */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            {item.title}
          </span>
        </div>
      ))}
    </section>
  );
};

export default DailyPlanGrid;
