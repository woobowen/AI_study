import type { FC } from 'react';
import { useUserStore } from '../../store/useUserStore';
import HeroSearch from './components/HeroSearch';
import DailyPlanGrid from './components/DailyPlanGrid';
import FeatureMatrix from './components/FeatureMatrix';
import OnboardingModal from './components/OnboardingModal';

/**
 * Dashboard 主控台视图
 * 职责：左侧内容区纵向布局容器，组合 HeroSearch、DailyPlanGrid 与 FeatureMatrix。
 * 当用户尚未完成画像引导（hasStudyPlan === false）时，
 * 在整个 Dashboard 上方渲染 OnboardingModal 全屏拦截层，
 * 强制用户先录入基础画像后才能操作主控台。
 */
const Dashboard: FC = () => {
  /** 是否已完成引导并生成学习计划 */
  const hasStudyPlan = useUserStore((s) => s.hasStudyPlan);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        padding: 32,
        width: '100%',
        boxSizing: 'border-box',
        /* 确保内容总高度超出视口，触发 .left-scroll-area 滚动 */
        minHeight: 'calc(100vh + 120px)',
      }}
    >
      {/* 未完成画像引导时，渲染全屏拦截弹窗 */}
      {!hasStudyPlan && <OnboardingModal />}

      <HeroSearch />
      <DailyPlanGrid />
      <FeatureMatrix />
    </div>
  );
};

export default Dashboard;
