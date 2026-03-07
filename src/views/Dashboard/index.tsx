import type { FC } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import AuthModal from '../../components/AuthModal';
import HeroSearch from './components/HeroSearch';
import DailyPlanGrid from './components/DailyPlanGrid';
import FeatureMatrix from './components/FeatureMatrix';
import OnboardingModal from './components/OnboardingModal';
import PretestBoard from './components/PretestBoard';

/**
 * Dashboard 主控台视图
 * 职责：左侧内容区纵向布局容器，组合 HeroSearch、DailyPlanGrid 与 FeatureMatrix。
 * 渲染管线采用四段式绝对排他拦截：
 * [鉴权] -> [画像] -> [学前测] -> [主控台]
 */
const Dashboard: FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isProfileComplete = useUserStore((s) => s.isProfileComplete);
  const isPretestComplete = useUserStore((s) => s.isPretestComplete);
  const resetProfile = useUserStore((state) => state.resetProfile);

  // 拦截层 1：未登录
  if (!isAuthenticated) {
    return <AuthModal />;
  }

  // 拦截层 2：已登录，未完善画像
  if (!isProfileComplete) {
    return <OnboardingModal />;
  }

  // 拦截层 3：画像已完善，但未完成学前测
  if (!isPretestComplete) {
    return <PretestBoard />;
  }

  // 拦截层 4：全流程通关，放行主界面
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
      <HeroSearch />
      <DailyPlanGrid />
      <FeatureMatrix />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
        <button
          onClick={resetProfile}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            backgroundColor: 'transparent',
            color: 'var(--color-warn-text, #D97706)',
            border: '1px dashed var(--color-warn-text, #D97706)',
            fontSize: '13px',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          🔄 重新评估能力边界
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
