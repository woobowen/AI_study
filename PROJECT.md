# PROJECT.md - 全景工程档案

## 1. 版本增量台账 (Delta Log)
- **最新战果 (前端状态机与拓扑大一统)**：
  - [Zustand 改造]：注入 `persist` 中间件，实现 `ai-study-user-storage` 本地硬盘持久化，根治 SPA 刷新失忆症。同时暴露 `resetProfile` 逃生舱，实现生命周期安全降级。
  - [路由越狱]：修复嵌套路由黑洞，将 `KnowledgeNode` 从 `MainLayout` 的左侧内容区物理剥离，接管 `100vw/100vh` 全屏沉浸渲染。
  - [10/20/70 架构]：成功在详情页剥离 `NodeRightSidebar` 组件（返回导航 10% / 进度罗盘 20% / AI 伴学 70%）。
  - [状态击穿]：彻底铲除 Dashboard 学习计划列表中的局部状态 (`learnedPoints`)，接入全局 `useUserStore`。实现“点击去学习 -> Zustand 状态去重写入 (`markKnowledgeMastered`) -> 路由跳转 -> 详情页罗盘动态水合”的完美双轨闭环。

## 2. 核心逻辑链与运行架构
- **单一状态真理源 (SSOT)**：所有业务状态（用户画像、测试结果、学习计划、已掌握知识点）必须 100% 驻留在 `useUserStore`。UI 组件仅作为状态的映射器 (Mapper) 与动作的分发器 (Dispatcher)。
- **沉浸页 (Knowledge Node) 拓扑**：
  - 左侧 80% 主脑区：`NodeK2VBlock` (浅色微拟态视频降维) + `Node3DBlock` (具身交互沙盒)。
  - 右侧 20% 陪伴区：`NodeRightSidebar` 挂载独立状态罗盘与对话流媒体插槽。
