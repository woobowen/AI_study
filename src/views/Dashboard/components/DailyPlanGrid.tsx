import type { CSSProperties, FC } from 'react';
import { useStudyPlan } from '../../../store/useStudyPlan';

/** 网格容器：严格 4 列 + 180px 自动行高（项目架构红线） */
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gridAutoRows: 'minmax(200px, auto)',
  gap: 24,
};

/** 卡片基础样式：遵循 8pt 网格与微拟态光影 */
const cardBaseStyle: CSSProperties = {
  borderRadius: 24,
  background: 'rgba(255, 255, 255, 0.72)',
  boxShadow: 'var(--shadow-soft)',
};

/**
 * DailyPlanGrid 每日计划卡片网格
 * 渲染策略：加载骨架 -> 实际阶段 -> 空状态
 */
const DailyPlanGrid: FC = () => {
  const planData = useStudyPlan((s) => s.planData);
  const isLoading = useStudyPlan((s) => s.isLoading);
  const learnedPoints = useStudyPlan((s) => s.learnedPoints);
  const markPointLearned = useStudyPlan((s) => s.markPointLearned);

  if (isLoading) {
    return (
      <section className="daily-plan-grid" style={gridStyle}>
        {/* 骨架卡片脉冲动画关键帧，仅在本组件作用域内使用 */}
        <style>
          {`@keyframes daily-plan-pulse {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 1; }
          }`}
        </style>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`daily-plan-skeleton-${index}`}
            style={{
              ...cardBaseStyle,
              padding: 24,
              animation: 'daily-plan-pulse 1.6s ease-in-out infinite',
            }}
          >
            <div
              style={{
                height: 24,
                width: '55%',
                borderRadius: 8,
                background: 'rgba(228, 200, 166, 0.4)',
                marginBottom: 24,
              }}
            />
            <div
              style={{
                height: 16,
                width: '100%',
                borderRadius: 8,
                background: 'rgba(228, 200, 166, 0.28)',
                marginBottom: 16,
              }}
            />
            <div
              style={{
                height: 16,
                width: '76%',
                borderRadius: 8,
                background: 'rgba(228, 200, 166, 0.24)',
              }}
            />
          </div>
        ))}
      </section>
    );
  }

  if (planData?.stages && planData.stages.length > 0) {
    return (
      <section className="daily-plan-grid" style={gridStyle}>
        {planData.stages.map((stage, index) => (
          <article
            key={index}
            style={{
              ...cardBaseStyle,
              padding: 24,
              paddingBottom: 24,
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-heading)',
              }}
            >
              {stage.stage_name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stage.knowledge_points.length > 0 ? (
                stage.knowledge_points.map((point, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* 学习状态圆圈：绿色表示已学习，灰色表示未学习 */}
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: learnedPoints[`${index}-${idx}`]
                            ? 'var(--color-success-bg)'
                            : 'transparent',
                          border: learnedPoints[`${index}-${idx}`]
                            ? '1px solid var(--color-success-text, #478211)'
                            : '1px solid #e0e0e0',
                        }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {point}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pointKey = `${index}-${idx}`;
                        if (!learnedPoints[pointKey]) {
                          alert(`即将跳转到学习页面: ${point}`);
                          markPointLearned(index, idx, true);
                        }
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: learnedPoints[`${index}-${idx}`] ? 'default' : 'pointer',
                        fontSize: 14,
                        lineHeight: '20px',
                        padding: 0,
                        marginLeft: 16,
                        color: learnedPoints[`${index}-${idx}`]
                          ? 'var(--text-secondary, #7a6a5a)'
                          : 'var(--text-heading)',
                      }}
                    >
                      {learnedPoints[`${index}-${idx}`] ? '已学习' : '去学习'}
                    </button>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: '20px',
                    color: 'var(--text-secondary, #7a6a5a)',
                  }}
                >
                  当前阶段暂无知识点。
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="daily-plan-grid" style={gridStyle}>
      <div
        style={{
          ...cardBaseStyle,
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: 'var(--text-secondary, #7a6a5a)',
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        等待 AI 生成专属学习路线...
      </div>
    </section>
  );
};

export default DailyPlanGrid;
