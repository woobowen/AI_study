import type { PropsWithChildren } from 'react';
import ProfilePanel from '../components/Sidebar/ProfilePanel';
import AIChat from '../components/Sidebar/AIChat';
import './MainLayout.css';

/**
 * MainLayout 组件 Props 接口
 * - 继承 React 内置的 PropsWithChildren，接收子组件作为左侧主内容区渲染内容
 */
interface MainLayoutProps extends PropsWithChildren {
  /* 当前无额外自定义属性，后续可在此扩展 */
}

/**
 * 全局 App Shell —— 主布局骨架
 * 采用 80/20 左右分栏：
 *   左侧 main.left-scroll-area  → 页面主内容（可滚动）
 *   右侧 aside.right-sidebar-fixed → AI 陪伴侧边栏（固定）
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-viewport">
      {/* ====== 左侧：主内容滚动区 ====== */}
      <main className="left-scroll-area">
        {children}
      </main>

      {/* ====== 右侧：AI 陪伴侧边栏（固定，flex 纵向布局） ====== */}
      <aside
        className="right-sidebar-fixed"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 顶部 ~30%：用户画像面板 */}
        <ProfilePanel />
        {/* 底部 ~70%：AI 对话区（弹性膨胀） */}
        <AIChat />
      </aside>
    </div>
  );
};

export default MainLayout;
