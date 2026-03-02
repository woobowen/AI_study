import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import OnboardingModal from '../Dashboard/components/OnboardingModal';

/** Onboarding 页面：承载原有画像与学前测弹窗流程 */
const Onboarding: FC = () => {
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  if (hasCompletedOnboarding) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
      }}
    >
      <OnboardingModal />
    </div>
  );
};

export default Onboarding;

