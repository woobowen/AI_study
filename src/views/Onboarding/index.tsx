import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

/** Onboarding 页面：承载原有画像与学前测弹窗流程 */
const Onboarding: FC = () => {
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  if (hasCompletedOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/" replace />;
};

export default Onboarding;
