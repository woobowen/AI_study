import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ImmersiveLayout from './layouts/ImmersiveLayout';
import Dashboard from './views/Dashboard';
import C2V from './views/tools/C2V';
import K2V from './views/tools/K2V';

/**
 * App 根组件
 * 职责：挂载全局布局骨架，传入页面级内容
 */
function App() {
  return (
    <Routes>
      {/* 主控台沿用 80/20 分栏布局 */}
      <Route
        path="/"
        element={(
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )}
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

      {/* C2V 独立使用沉浸式布局，绝不进入分栏壳 */}
      <Route
        path="/tools/c2v"
        element={(
          <ImmersiveLayout>
            <C2V />
          </ImmersiveLayout>
        )}
      />
    </Routes>
  );
}

export default App;
