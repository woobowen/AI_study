import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ImmersiveLayout from './layouts/ImmersiveLayout';
import { useUserStore } from './store/useUserStore';
import Dashboard from './views/Dashboard';
import Onboarding from './views/Onboarding';
import QuizResultPage from './views/Onboarding/Quiz';
import K2V from './views/tools/K2V';

/**
 * App 根组件
 * 职责：挂载全局布局骨架，传入页面级内容
 */
function App() {
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  return (
    <Routes>
      {/* 主控台沿用 80/20 分栏布局 */}
      <Route
        path="/"
        element={
          hasCompletedOnboarding
            ? (
              <MainLayout>
                <Dashboard />
              </MainLayout>
            )
            : <Navigate to="/onboarding" replace />
        }
      />

      {/* Onboarding 路由：未完成画像时强制进入 */}
      <Route
        path="/onboarding"
        element={hasCompletedOnboarding ? <Navigate to="/" replace /> : <Onboarding />}
      />

      {/* Quiz 结果页：提交后生成 personal_profile 并回写 Store */}
      <Route
        path="/quiz"
        element={hasCompletedOnboarding ? <Navigate to="/" replace /> : <QuizResultPage />}
      />

      {/* K2V 独立使用沉浸式布局，绝不进入分栏壳 */}
      <Route
        path="/tools/k2v"
        element={(
          <ImmersiveLayout>
            <K2V />
          </ImmersiveLayout>
        )}
      />
    </Routes>
  );
}

export default App;
