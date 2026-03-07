import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../store/useUserStore';

export const NodeRightSidebar: FC = () => {
  const navigate = useNavigate();
  const studyPlan = useUserStore((state) => state.studyPlan);
  const masteredKnowledge = useUserStore((state) => state.mastered_knowledge) || [];

  // 智能游标：动态定位当前活跃阶段 (Active Stage)
  let totalNodes = 0;
  let completedNodes = 0;

  if (studyPlan && studyPlan.length > 0) {
    // 寻找第一个未被完全掌握的阶段（即今天的任务）
    const activeStage = studyPlan.find((stage: any) => {
      const knowledgePoints = stage.knowledge_points || [];
      return !knowledgePoints.every((point: string) => masteredKnowledge.includes(point));
    }) || studyPlan[studyPlan.length - 1]; // 如果全部通关，停留在最终阶段展示满进度

    const knowledgePoints = activeStage.knowledge_points || [];
    totalNodes = knowledgePoints.length;
    // 仅计算该阶段内的掌握数量
    completedNodes = knowledgePoints.filter((point: string) => masteredKnowledge.includes(point)).length;
  }

  return (
    <aside style={{ width: '20%', minWidth: '340px', height: '100vh', display: 'flex', flexDirection: 'column', borderLeft: '2px solid rgba(228, 200, 166, 0.15)', backgroundColor: 'var(--bg-canvas)' }}>
      
      {/* Top 10% - 返回中枢 */}
      <div style={{ height: '10%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '999px', backgroundColor: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-highlight-bg)'; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; e.currentTarget.style.borderColor = 'var(--code-border)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <span style={{ fontSize: '18px' }}>←</span>
          <span>返回主页面</span>
        </button>
      </div>

      {/* Next 20% - 今日进度罗盘 */}
      <div style={{ height: '20%', padding: '24px', borderBottom: '1px solid rgba(228, 200, 166, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '15px' }}>今日学习计划</h3>
        <div style={{ flex: 1, backgroundColor: 'var(--code-bg)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', border: '1px solid var(--code-border)', boxShadow: 'inset 0 2px 8px rgba(228, 200, 166, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '14px', backgroundColor: 'var(--bg-canvas)' }}>
                {completedNodes}/{totalNodes > 0 ? totalNodes : '-'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-heading)', fontSize: '14px', fontWeight: 600 }}>当前节点突击中</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '12px', opacity: 0.8 }}>保持节奏，即将通关</span>
              </div>
            </div>
        </div>
      </div>

      {/* Bottom 70% - AI 伴学 */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <h3 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '15px' }}>AI 伴学</h3>
        <div style={{ flex: 1, backgroundColor: 'var(--code-bg)', borderRadius: '16px', border: '1px solid var(--code-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(228, 200, 166, 0.05)' }}>
            <span style={{ color: 'var(--text-primary)', opacity: 0.5, fontSize: '14px', fontWeight: 500 }}>[ 💬 对话流媒体物理插槽待命 ]</span>
        </div>
      </div>

    </aside>
  );
};
