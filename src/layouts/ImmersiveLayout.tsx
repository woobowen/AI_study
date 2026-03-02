import type { FC, PropsWithChildren } from 'react';

/**
 * 全屏沉浸布局容器
 * - 外层：100vw + 最小满高视口，承载页面级滚动
 * - 内层：最大宽度 1200px，水平居中，承载业务内容
 */
const ImmersiveLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ImmersiveLayout;

