import MainLayout from './layouts/MainLayout';
import Dashboard from './views/Dashboard';

/**
 * App 根组件
 * 职责：挂载全局布局骨架，传入页面级内容
 */
function App() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}

export default App;
