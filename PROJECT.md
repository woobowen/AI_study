# 核心真理源：Project Warm-Parchment 全局架构与工程指导
**版本**: V1.0 (Release Candidate)
**定位**: 本文档为项目最高级别的工程化蓝图，定义了从视觉底座、路由拓扑到降级防御的全部核心逻辑。任何具体功能的开发、组件的拆分均不可违背本文档的约束。

---

## 壹、 工程基石与环境铁律 (Infrastructure & Environment)
1. **运行环境**: 全盘基于 WSL2 (Ubuntu) 原生文件系统。所有路径必须为绝对路径或 `~/` 开头的相对路径。严禁出现任何跨界挂载 (`/mnt/c/`) 或 Windows 反斜杠 (`\`)。
2. **核心技术栈 (推荐)**: 
   - 框架: React (或 Next.js App Router) + TypeScript (强类型约束)。
   - 样式: Tailwind CSS + CSS 变量 (CSS Variables) 双驱。
   - 状态管理: Zustand / Pinia (按需，用于处理 Layout 级跨页面状态保活)。
3. **功能降级开关 (Feature Flags)**:
   - 核心变量: `const ENABLE_ONLINE_IDE = false;`
   - 必须统一在全局 `~/src/config/features.ts` 中管理，作为全站“在线编程平台”的视觉、交互与路由封印的唯一真相源。

### 4. 完整物理目录树规范 (Vite-Driven Project Structure)
引入 Vite 作为构建工具后，项目根目录与 `src/` 内部必须严格遵循以下物理结构。任何新增文件/目录不得突破此拓扑约束。

```
~/project-root/
├── vite.config.ts              # Vite 构建配置（含反向代理 proxy 规则）
├── package.json                # 依赖清单与脚本入口
├── tsconfig.json               # TypeScript 编译配置
├── index.html                  # Vite 单页应用入口 HTML
├── public/                     # 静态资源（不经 Vite 处理，直接拷贝）
│   └── favicon.ico
│
└── src/                        # ====== 源码根目录 ======
    ├── main.tsx                # 应用启动入口（挂载 React Root）
    ├── App.tsx                 # 顶层路由分发与 Layout 容器选择器
    │
    ├── config/                 # 全局配置中心
    │   ├── features.ts         # 功能降级开关（ENABLE_ONLINE_IDE 等）
    │   └── api.ts              # 微服务 API 路径前缀（API_PREFIX）
    │
    ├── styles/                 # 全局样式层
    │   ├── variables.css       # CSS Variables 调色板 & 光影 & 网格 Token
    │   ├── global.css          # 全局 Reset / 基础排版 / 字体栈声明
    │   └── neumorphism.css     # 微拟态光影工具类
    │
    ├── layouts/                # 宏观视图容器（路由级 Layout 壳）
    │   ├── SplitLayout.tsx     # 80/20 分栏布局（Dashboard + Node 共享）
    │   └── ImmersiveLayout.tsx # 全屏沉浸布局（AIGC 工具组 + 金库）
    │
    ├── views/                  # 页面级路由组件（一个路由对应一个 View）
    │   ├── Dashboard/          # /dashboard 主控台
    │   ├── KnowledgeNode/      # /node/:nodeId 知识点下钻页
    │   ├── Directory/          # /directory 知识点大全
    │   ├── Vault/              # /vault 个人金库
    │   └── tools/              # AIGC 工具组
    │       ├── K2V/            # /tools/k2v 视频生成车间
    │       ├── C2V/            # /tools/c2v 代码解析车间
    │       └── Sandbox3D/      # /tools/3d-sandbox 具身交互沙盒
    │
    ├── components/             # 原子/分子级可复用组件
    │   ├── AiSidebar/          # AI 伴学侧边栏（Layout 级常驻，零销毁）
    │   ├── Toast/              # 全局轻提示组件
    │   ├── Badge/              # 状态徽章
    │   └── ...                 # 按需扩展，禁止出现页面级业务逻辑
    │
    ├── store/                  # Zustand 全局状态树
    │   ├── useUserProfile.ts   # 用户画像状态（age, language, study_duration 等）
    │   ├── useAiSidebar.ts     # AI 侧边栏上下文保活状态
    │   ├── useKnowledgeGraph.ts  # 动态知识追踪图谱（存储 mastered_knowledge 数组，接管全局学习进度）
    │   └── ...                 # 按领域拆分，单 Store 单职责
    │
    ├── api/                    # 接口层（DDD 领域驱动，按微服务隔离）
    │   ├── _shared/            # 跨领域共享层
    │   │   ├── request.ts      # 统一 fetch 封装、拦截器、画像自动注入
    │   │   └── types.ts        # 全局通用 API 响应壳类型
    │   ├── goagents/           # GoAgents 微服务（LLM 能力：计划/测试/讲解）
    │   │   ├── studyplan.ts
    │   │   ├── pretest.ts
    │   │   ├── knowledge.ts
    │   │   └── types.ts
    │   ├── user/               # 用户中心微服务（画像/认证/偏好）
    │   │   ├── profile.ts
    │   │   ├── auth.ts
    │   │   └── types.ts
    │   └── vault/              # 金库微服务（错题本/收藏夹）
    │       ├── mistakes.ts
    │       ├── favorites.ts
    │       └── types.ts
    │
    └── types/                  # 全局 TypeScript 接口与类型定义
        ├── user.d.ts           # 用户画像、认证相关类型
        ├── knowledge.d.ts      # 知识点、学习计划相关类型
        ├── api.d.ts            # API 通用请求/响应泛型
        └── router.d.ts         # 路由参数与元信息类型
```

**目录铁律**:
* **`api/` 隔离红线**: 每个微服务子目录（`goagents/`, `user/`, `vault/`）内的 Service 函数严禁跨目录 import 其他领域的 Service。跨领域数据编排只允许在 `store/` 或 `views/` 层完成。
* **`layouts/` vs `views/` 边界**: Layout 只负责骨架分栏与常驻组件挂载，严禁包含任何业务逻辑；View 只负责页面级数据获取与子组件编排，严禁定义全局样式。
* **`components/` 纯净性**: 组件必须是无业务副作用的纯 UI 单元，数据一律通过 Props 或 Store 注入，严禁在组件内部直接调用 `api/` 层。
* **大体积媒体资产直出铁律**: 所有用于推荐、占位或展示的大型视频/3D模型，必须存放于 `public/mock_media/` 中。前端严禁通过 import 引入媒体导致 Webpack/Vite 编译拥堵，必须统一使用绝对路径（如 `src="/mock_media/xxx.mp4"`）利用本地服务器直出。

---

## 贰、 全局视觉与微拟态系统 (Design Tokens & Neumorphism)
全站严禁出现纯黑 (`#000000` 或 `rgba(0,0,0, X)`) 投影。必须使用以下定义的变量体系重写 UI 库底层。

### 1. 核心调色板 (Color Palette)
* `--bg-canvas`: `#FFFDF4` (应用级核心底色，奶油白)
* `--text-primary`: `#2C1608` (正文深棕色，确保 WCAG 对比度)
* `--text-heading`: `#BE8944` (大标题与高亮交互点，暖金色)
* `--code-bg`: `#fff7e8` (代码块专属底色)
* `--code-border`: `#e4c8a6` (代码块边框)

### 2. 语义化状态色板 (Semantic Colors)
* **概念 (Concept)**: `--color-concept-bg: #FAECD2` | `--border: #f2cf7f` | `--text: #9B6D0B`
* **警告 (Warn)**: `--color-warn-bg: #FBDDD6` | `--border: #f4b1a1` | `--text: #C84A2B`
* **高亮 (Highlight)**: `--color-highlight-bg: #FDDFCA` | `--border: #f7bc93` | `--text: #C35101`
* **信息 (Info)**: `--color-info-bg: #ecf6fa` | `--border: #bde0ee` | `--text: #1A7F99`
* **成功 (Success)**: `--color-success-bg: #effce3` | `--border: #c7e7aa` | `--text: #478211`

### 3. 光影与深度系统 (Elevation System)
利用 Z 轴光影建立空间层级：
* `--shadow-soft`: `6px 6px 12px rgba(228, 200, 166, 0.3), -6px -6px 12px rgba(255, 255, 255, 0.8)` (常驻卡片，微凸纸面)
* `--shadow-hover`: `8px 8px 16px rgba(228, 200, 166, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.9)` (卡片悬浮，Y轴上浮)
* `--shadow-inner`: `inset 4px 4px 8px rgba(228, 200, 166, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.8)` (输入框、搜索栏内凹槽)

### 4. 8pt 绝对网格与排版 (Grid & Typography)
* **间距法则**: 所有 margin, padding, gap, border-radius 必须严格为 8 的倍数 (8px, 16px, 24px, 32px, 40px, 48px)。禁止随意使用 5px/10px。
* **圆角规范**: 卡片统一 `16px` 或 `24px`，胶囊按钮 `9999px`。
* **字体栈**:
    * 正文: `Inter`, `system-ui`, `"PingFang SC"`, `"Microsoft YaHei"`, `sans-serif` (字重 400)
    * 标题: 同上 (字重严格约束为 700 或 800)
    * 代码: `font-family: 'Fira Code', 'JetBrains Mono', monospace;`

---

## 叁、 路由拓扑与 Layout 隔离 (Routing & Layout Architecture)

### 1. 路由字典与黑洞机制
* `/dashboard` ➔ 主控台 [枢纽中心]
* `/node/:nodeId` ➔ 知识点下钻页 [动态分发]
* `/tools/k2v` ➔ 视频生成车间 [工具台，不发生内部跳转，强制绑定 ImmersiveLayout]
* `/tools/c2v` ➔ 代码解析车间 [工具台，不发生内部跳转]
* `/tools/3d-sandbox` ➔ 具身交互沙盒 [工具台，不发生内部跳转]
* `/directory` ➔ 知识点大全
* `/vault` ➔ 个人金库 (聚合路由器，依 `type` 动态 Push)
* **[路由黑洞]** `/ide`: 全局路由守卫强制拦截，派发 `ide-blocked-access` 事件并 `redirect` 至 `/dashboard`。

### 2. 双重视图容器 (Dual Layout Containers)
* **分栏布局 (Split-Layout)**: `/dashboard` 与 `/node/:nodeId` 共享。左侧 80% 为主功能区，右侧 20% 为 AI 伴学侧边栏。
    * **极致要求**: AI 侧边栏必须作为 Layout 级的常驻组件，利用全局状态管理接管上下文，保证在页面剧烈切换时实现**零重绘、零销毁**。侧边栏折叠必须使用 `flex-basis` 配合贝塞尔曲线过渡，禁止 `display: none`。
* **全屏沉浸布局 (Immersive-Layout)**: AIGC 工具组与金库页面专用。`100vw` 宽度，内容区锁死 `max-width: 1200px` 居中。

### 3. K2V 视图专属蓝图 (Knowledge2Video Immersive Blueprint)
`/tools/k2v` 为 AIGC 工具组核心战场，必须在路由层强制挂载 `ImmersiveLayout`，严禁回退至任何 80/20 分栏容器。页面骨架必须遵守以下三段式构成：

1. **幽灵态返回按钮 (Ghost Back Button)**
   - 位置：视图左上角，遵循 8pt 网格（推荐 `top: 24px; left: 24px`）。
   - 视觉：无实体底板，透明背景 + 轻微文字高亮，Hover 时仅允许出现 `--shadow-soft` 的弱光影，不得出现纯黑描边。
   - 交互：仅承担路由回退职责，不得绑定业务提交逻辑。

2. **存量视频矩阵 (Responsive Masonry Video Matrix)**
   - 位置：主内容区上半区域，使用响应式瀑布流卡片编排已有视频资产。
   - 规范：卡片圆角统一 `16px/24px`，间距必须为 8 的倍数；卡片封面与元信息分层呈现，不得使用硬编码像素“魔法数字”。
   - 约束：视频数据为空时，必须提供极简空态而非空白画布。

3. **纯白高亮 AIGC 生成控制台 (AIGC Control Console)**
   - 位置：主内容区下半区域，采用高对比纯白台面，形成与奶油底色的视觉分层。
   - 组件构成：
     - 无边框 `Textarea`（内凹感由 `--shadow-inner` 与背景变量提供）。
     - 难度药丸单选组（胶囊按钮，圆角 `9999px`，状态色来自语义变量）。
     - 巨型 CTA 生成按钮（主行动入口，Hover 使用 `--shadow-hover`）。
   - 输入约束：文本区、难度选择、时长输入必须具备前端边界防御与禁用态反馈。

4. **生成中加载遮罩 (In-Console Loading Overlay)**
   - 触发条件：K2V 进入视频生成态（SSE running）。
   - 挂载位置：必须附着在“控制台容器内部”，严禁全屏遮挡整个 Immersive 页面。
   - 视觉纪律：
     - 强制使用 `backdrop-filter: blur(8px)`（含 `-webkit-backdrop-filter` 兼容）。
     - 叠加低饱和极简微光层与暖金色光环，统一沿用项目暖色语义，不得引入冷白闪烁特效。
     - 动效节奏需克制，避免持续高频闪烁造成视觉疲劳。

### 4. C2V / K2V 同构 UI 铁律 (Dual-End Isomorphic UI Laws)
1. **双端历史矩阵列阵 (Dual-End History Matrix)**
   - 适用范围：`/tools/k2v` 与 `/tools/c2v` 底部历史区。
   - 强制规范：历史记录容器必须且只能使用 3 列 CSS Grid 瀑布流，固定写法为 `gridTemplateColumns: 'repeat(3, 1fr)'`。
   - 布局纪律：历史矩阵必须位于输入/控制台区域下方，严禁通过条件渲染覆盖或替换原始输入区；输入区、生成区、历史区必须保持纵向堆叠。
2. **16:9 沉浸视界 (16:9 Immersive Media Viewport)**
   - 适用范围：K2V/C2V 的当前播放区与历史卡片视频容器。
   - 强制样式：播放器容器必须显式挂载 `aspectRatio: '16/9'`、`backgroundColor: '#000000'`、`boxShadow: 'var(--shadow-soft)'`。
   - 禁止事项：严禁将 `<video>` 直接作为无容器裸元素渲染，避免宽高塌陷、比例失真与视觉层级失控。

### 5. 3D Sandbox 专属蓝图 (3D Embodied Sandbox Blueprint)
1. **宏观骨架**
   - 适用范围：`/tools/3d-sandbox`。
   - 必须在路由层强制挂载 `ImmersiveLayout`（`100vw`），全面继承 K2V 的全屏沉浸布局与单输入流逻辑（仅输入知识点，撤销代码双轨）。
2. **文案与 Props 契约**
   - Hero Title 锁死为：`3D 模型沙盒`。
   - 副标题锁死为：`你的专属具身认知交互库`。
   - 搜索框 Placeholder 锁死为：`搜索已生成的 3D 交互模型...`。
3. **3D 存量矩阵视觉铁律 (The 3D Gallery Grid)**
   - **视觉暗示 (Affordance)**：卡片封面右上角或中央必须强制挂载“360°旋转”或“3D立方体”的矢量 Icon。
   - **悬浮物理反馈 (Hover State)**：鼠标悬浮时，内部静态缩略图必须触发极其缓慢的 Y 轴自转动画（`transform: rotateY`），建立立体空间直觉。
   - **挂载机制**：绝对禁止使用后端动态生成的 SSR `/viewer/:hash` 路由。前端在收到 SSE `complete` 事件的 `htmlSha256` 后，必须通过 Vite Proxy 直接请求静态物理资产，挂载路径锁死为 `<iframe src="/api/3d-sandbox/outputs/<hash>.html" />`。
4. **AIGC 控制台规约 (Generator Console)**
   - 恢复单输入框：`输入知识点描述`。
   - 保留难度药丸：`[入门]`、`[中等]`、`[专精]`。
   - CTA 按钮文案锁死为：`[✨ 渲染 3D 交互模型]`。

### 6. 知识节点沉浸页布局铁律 (Knowledge Node Immersive Layout Laws)
1. **宏观骨架 80/20 分治**
   - 适用范围：`/node/:nodeId`。
   - 左侧主脑区必须占据 `80%` 宽度，并允许纵向滚动，作为知识瀑布流主舞台。
   - 右侧陪伴区必须占据 `20%` 宽度，并保持固定陪伴属性（常驻、稳定、不可被内容区挤压）。
2. **右侧陪伴区 10/20/70 精准切割**
   - 右侧容器必须使用纵向 Flex 切分为三个不可混并的区域：
     - `10%`：返回中枢（Back Hub），仅承载返回导航与轻交互提示。
     - `20%`：今日进度罗盘（Daily Progress Compass），必须包含环形进度条与成功态点亮反馈。
     - `70%`：AI 伴学聊天流（AI Companion Chat Stream），作为长会话主容器，优先保证可读与连续性。
   - 三段高度比例属于宪法级硬约束，严禁以内容自适应破坏 10/20/70 比例。

---

## 肆、 防御机制与工程降级 (Defensive Engineering)
特对未完成的“在线编程平台 (IDE)”进行三维降级：

1. **视觉降级 (卡片态)**:
   - 注入 `--color-info-bg` 底色。
   - 叠加 45deg 斜向扫描线纹理。
   - 挂载 `[🚧 即将上线]` 专属 Badge。
   - 物理锁定：`cursor: not-allowed; pointer-events: none;`
2. **交互降级 (柔性阻断)**:
   - 在 Node 页面底部的 CTA 动作区，保留按钮的点击能力。
   - 执行前端事件劫持 (`e.preventDefault()`)。
   - 唤起带有情绪抚慰价值的 `globalToast` 轻提示，替代死按钮。
3. **架构解耦**:
   - 以上所有阻断逻辑被 `ENABLE_ONLINE_IDE` 开关包裹，一键切换即可解除全站封印。

---

## 伍、 视图级微操红线 (Micro-interaction Chokepoints)
1. **主控台 (Dashboard)**: “每日计划”模块强制使用 CSS Grid 的 `auto-rows: 180px` + `repeat(4, 1fr)` 实现流式回流，严禁使用 JS 计算换行。
2. **知识节点 (Knowledge Node)**: 左侧 80% 区域彻底摒弃左右分栏，执行标准的单列纵向瀑布流 (`flex-direction: column; gap: 40px`)。底部 CTA 必须是严格的状态机驱动。
3. **C2V 工具台**: 代码输入框强制挂载 `--code-bg` 变量，与上方普通 `textarea` 形成剧烈的视觉对比场。
4. **金库 (Vault)**: 顶部的错题/收藏切换必须依赖绝对定位的物理滑块 (Slider) 在底槽 (Track) 中平滑移动，绝不允许使用生硬的独立按钮。
5. **节点页左侧瀑布流 (Left Waterfall)**: 知识节点左侧主脑区必须彻底抛弃横向网格，强制采用自上而下单线程沉浸流；卡片间距固定为 `gap: 40px`，不得降级。
6. **Card 5 终极状态机 (Card 5 State Machine)**: 第五卡片为闭环核心，状态流转必须严格遵循 `State A (初见态，巨大测试按钮) -> State B (测试中，展示考题) -> State C (通关分发态，展示绿色通过反馈 + 推荐习题 + 底部 Action Bar 条件渲染分支)`，严禁跳态与并态混写。
7. **3D 沙盒占位符契约 (Card 4 Placeholder Contract)**: 在 Card 4 后端未就绪前，前端必须提供带“可交互”标签的 WebGL 占位容器完成物理占位，视觉比例必须保持 `16:9` 或固定高度（例如 `500px`），不得用文本空态替代。
## 陆、 GoAgents 后端协同时代 (Backend Integration & SSE Flow)
### 1. 全局用户画像状态树 (Global User Profile State)
前端必须建立一个强类型的全局状态中心（推荐 Zustand），用于存储与管理统一用户画像（User Profile）。
- **核心字段**: 年龄 (age)、偏好语言 (language)、总学习周期（决定计划的天数/阶段数） (study_duration)、补充信息 (supplements)。
- **注入拦截**: 在发起 `/studyplan`, `/pretest` 等核心业务请求前，API 拦截器或 Service 层必须自动从状态树中提取并组装这些画像数据，严禁在 UI 组件中散落拼凑。

### 2. SSE 响应式流处理机制 (Server-Sent Events)
由于后端核心能力（学习计划、测试、知识讲解等）均基于大语言模型且采用 SSE 流式返回，前端严禁使用传统的阻塞式 Axios 请求处理大段文本。
- **状态机映射**: 前端必须精确捕获并映射后端的四个流状态事件：`running` (UI 展示骨架屏或打字机前置动效) / `finished` (UI 结算与卡片固化) / `failed` (UI 降级提示与重试逻辑) / `result` (增量或全量数据块)。
- **技术栈选型**: 推荐基于原生 `fetch` API 结合 `ReadableStream` 进行二次封装，或者使用 `@microsoft/fetch-event-source` 处理复杂的流式通信。

### 3. 错误处理规范：SSE 强校验熔断与前端防御 (Error Handling & Circuit Breaker Guardrails)
1. **SSE 强校验熔断警示（后端已知隐患）**
   - GoAgents 后端在解析 MindMap 结构时，对 `sub_topics` 字段执行强校验。
   - 一旦 LLM 在任一分支返回 `sub_topics: []`（空数组），后端会在解码阶段触发阶段性失败：`err=decode mind map`。
   - 该错误会导致 SSE 流被物理切断（熔断），前端可能只能收到中间态事件而无法收到完整结果。
   - 该问题在后端契约未修复前，定义为“系统级已知风险”，前端不得将其误判为普通网络波动。

2. **前端防御补丁（KnowledgeNode 视图层已部署）**
   - `KnowledgeNode` 视图层必须在 `status === 'failed'` 时立即触发 UI 拦截：终止继续渲染不完整的 MindMap 结果，并给出明确失败反馈。
   - 必须保留并触发 `fetchNodeData` 重试机制，允许用户在熔断后进行受控重拉，避免页面永久卡死在半成品状态。
   - 对抗目标明确为“结构性幻觉”与“半流式脏数据污染”：宁可降级提示，也不渲染不可信结构。

3. **战略优先级临时切换（业务开发 → 架构维护）**
   - 在 GoAgents 空数组容错（`sub_topics`）完成前，知识点详情页相关迭代应以稳定性与契约对齐为第一优先级。
   - 新功能开发必须服从“先恢复流式契约稳定，再扩展交互能力”的顺序，不得并行推进高风险功能。

---

## 柒、 微服务网关与接口调度规范 (Microservice Gateway & API Dispatch Protocol)
前端必须按照领域驱动设计 (DDD) 原则组织 API 调用层，并通过反向代理统一网关分发请求，严禁前端直连后端微服务实例。

### 1. API 目录拆分规范 (DDD-Based API Directory)
* **顶层入口**: 所有 API 相关代码统一收敛至 `~/src/api/` 目录下。
* **按领域聚合**: 每个后端微服务对应一个独立子目录，目录名必须与后端服务名严格对齐。示例结构：
    ```
    ~/src/api/
    ├── goagents/          # GoAgents 服务（学习计划、学前测、知识讲解等 LLM 能力）
    │   ├── studyplan.ts   # 学习计划相关接口
    │   ├── pretest.ts     # 学前测相关接口
    │   ├── knowledge.ts   # 知识点讲解相关接口
    │   └── types.ts       # 该领域的请求/响应类型定义
    ├── user/              # 用户中心服务（画像、认证、偏好）
    │   ├── profile.ts
    │   ├── auth.ts
    │   └── types.ts
    ├── vault/             # 金库服务（错题本、收藏夹）
    │   ├── mistakes.ts
    │   ├── favorites.ts
    │   └── types.ts
    ├── sandbox3d/         # 3D 具身交互沙盒服务
    │   ├── generate.ts    # 核心生成 API
    │   └── types.ts       # 该领域的请求/响应类型定义
    └── _shared/           # 跨领域共享层（拦截器、基础请求封装、通用类型）
        ├── request.ts     # 统一的 fetch/axios 封装与拦截器
        └── types.ts       # 全局通用的 API 响应壳类型
    ```
* **隔离铁律**: 每个领域子目录内的 Service 函数只允许调用本领域的后端接口。若业务需要跨领域数据编排（如学习计划需要用户画像），必须通过 `_shared/request.ts` 中的拦截器自动注入，或在 UI 层的 Hook/Store 中显式组合，**严禁在某个领域的 Service 文件中直接 import 另一个领域的 Service**。

### 2. 反向代理与网关分发 (Reverse Proxy & Gateway)
* **前端零感知**: 前端代码中所有 API 请求的 `baseURL` 必须指向统一的反向代理前缀路径（如 `/api/goagents/`, `/api/user/`），由开发环境的 `vite.config.ts` (或 `next.config.js`) 中的 `proxy` 配置，以及生产环境的 Nginx/Traefik 网关负责将请求分发至对应的后端微服务实例。
* **配置集中管理**: 所有代理路径前缀必须统一定义在 `~/src/config/api.ts` 中，作为各领域 Service 的 `baseURL` 唯一真相源。示例：
    ```typescript
    // ~/src/config/api.ts
    /** 各微服务的 API 路径前缀，由反向代理统一分发 */
    export const API_PREFIX = {
      GOAGENTS: '/api/goagents',
      USER: '/api/user',
      VAULT: '/api/vault',
    } as const;
    ```
* **端口不可见**: 前端代码中严禁出现任何后端微服务的真实端口号（如 `:8080`, `:3001`）。端口映射完全由反向代理层管控，前端无需且不应感知。
* **全域代理矩阵真理（当前生效）**: 路由映射必须严格遵循以下规约，不得擅自漂移：
  - `/api/goagents` -> `8080`
  - `/api/v1`（User/Vault）-> `3000`
  - `/api/k2v` -> `8081`
  - `/api/c2v` -> `8082`
  - `/api/3d-sandbox` -> `8083`（3D 具身交互后端，启动时强制注入 `PORT=8083` 避开 `3000` 端口撞车）
* **GoAgents CORS 穿透实战铁律**: 已知 `goagents` 服务（默认端口 `8080`）物理缺失 CORS 中间件。前端绝对禁止直接向 `http://localhost:8080` 发起跨域请求；开发环境必须在 `vite.config.ts` 中配置代理（如将 `/api/goagents` rewrite 并 proxy 到 `http://localhost:8080`）完成跨域穿透。

### 3. 跨领域数据交互规约 (Cross-Domain Data Interaction)
* 当一个页面/组件需要同时消费多个微服务的数据时，必须在 UI 层（Page/Container 组件或自定义 Hook）中分别调用各领域的 Service 函数，再在本地进行数据组装。
* **严禁**在任何单一领域的 Service 文件中发起对其他领域后端接口的请求。
* 若遇到后端已提供聚合接口（BFF 层）的情况，该聚合接口应归属于调用方的领域目录，或单独建立 `~/src/api/bff/` 目录管理。

### 4. 鉴权穿透与异构载荷映射 (Auth Penetration & Heterogeneous Payload Mapping)
1. **鉴权穿透 (Blob Proxy)**
   - 受 `X-API-Key` 保护的视频资源，前端严禁将后端 URL 字符串直接绑定到 `<video src>`。
   - 必须由 API 层提供专用拦截器函数（如 `fetchVideoBlobUrl` / `fetchK2VVideoBlobUrl` / `fetchC2VVideoBlobUrl`），以 `fetch` 拉取二进制流后转换为 `URL.createObjectURL(blob)`，再将本地对象 URL 交给 UI 层渲染。
   - UI 层职责仅限播放与交互，鉴权头拼装、流拉取与对象 URL 生成必须在 `src/api/` 层闭环。
2. **异构载荷映射 (Heterogeneous Payload Mapping)**
   - 后端 Schema 为扁平结构时，前端请求体必须执行字段展平映射；字段名必须按目标引擎契约分流，严禁混发。
   - **绝对铁律**：发往 Python 引擎（C2V/K2V）的补充画像必须映射为 `extra_info`；发往 Go 引擎（goagents，如 `/knowledge-explanation`, `/knowledge-quiz`）的补充画像必须严格映射为 `profile_text`。
   - 用户画像必须提取并映射 `age`、`language` 等核心字段；补充描述（`supplements` / `profile_summary`）在进入适配层后按上述引擎契约落位。
   - 任何字段映射变更必须同步更新 TypeScript 类型定义与 Service 组装逻辑，禁止“UI 直拼字符串”绕过 API 层契约。
3. **C2V/K2V 同源设计铁律 (Shared Design Doctrine)**
   - C2V 与 K2V 必须共享同一套底层设计理念：补充画像摘要统一进入隔离字段 `extra_info`，严禁挤占或污染 Go 引擎的 `profile_text` 语义位。
   - C2V 与 K2V 的请求必须使用独立 `X-API-Key` 鉴权通道，由 API 层统一注入，页面层禁止手拼 Header。
   - C2V 与 K2V 路由入口必须挂载 `ImmersiveLayout` 的 16:9 沉浸视界，禁止回退到 Dashboard 80/20 分栏壳。
4. **3D 沙盒异构适配器铁律 (3D Sandbox Adapter Doctrine)**
   - 发往 3D 后端（`POST /api/3d-sandbox/api/generate`）的请求体必须经过 Adapter 转换，严禁 UI 层直接拼装或直发。
   - 前端 Store 的通用画像必须被映射为后端期望的特定 `userProfile` 字段（如 `programmingLanguage`、`studyCycle`、`difficulty`），严禁直接透传全局 Store 状态。

### 4. K2V 微服务接入规约 (K2V Gateway & Auth Contract)
1. **端口防撞与代理分流**
   - K2V 服务默认 `8080` 与 GoAgents 端口存在冲突风险，开发态必须在 `vite.config.ts` 中新增独立代理前缀（如 `/api/k2v`）并映射至宿主机其他端口（推荐 `http://localhost:8081/`）。
   - 前端业务代码只允许消费 `/api/k2v` 前缀，严禁直接访问 `:8081`。

2. **鉴权壁垒（强制 Header）**
   - 所有 K2V 接口（`/api/v1/*`）请求必须在 Request Header 中注入 `X-API-Key`。
   - 缺失 `X-API-Key` 视为严重违规，前端必须在请求封装层统一注入，禁止在页面组件内临时拼接。

3. **目录隔离与领域分治**
   - K2V 接口层必须独立维护于 `~/src/api/k2v/`，包含 `index.ts`、`types.ts` 与必要的 SSE 封装。
   - 严禁将 K2V 的 Service 混写进 `goagents/`，也禁止 `k2v/` 直接 import `goagents/` Service。

4. **视频资源闭环（SSE → 文件流）**
   - 当前端在 SSE `result` 事件中拿到 `data.video_file`（文件名）后，必须按以下规则拼接播放地址：
     - `/api/k2v/api/v1/files/{filename}`
   - 未完成该拼接闭环时，严禁直接渲染裸文件名或本地路径到 `<video>`。

### 5. Rust 用户中心与金库接入规约 (UserProfile & Vault)
1. **Vite Proxy 映射（本地 Rust 穿透）**
   - 开发环境必须在 `vite.config.ts` 中新增并启用 `/api/v1`（或团队统一自定义前缀）到 `http://127.0.0.1:3000` 的代理规则，用于穿透 Rust 用户中心服务本地端口。
   - 前端业务代码必须始终调用代理前缀，不得直接书写 `http://127.0.0.1:3000`，避免 CORS 与环境切换污染。
   - 参考基线（示意）：
     ```typescript
     // vite.config.ts
     server: {
       proxy: {
         '/api/v1': {
           target: 'http://127.0.0.1:3000',
           changeOrigin: true,
         },
       },
     }
     ```

2. **JWT 鉴权闭环（登录/注册 -> Token 持久化 -> 全量注入）**
   - 前端在调用 `POST /api/v1/auth/login` 或 `POST /api/v1/auth/register` 后，必须从响应壳 `data.token` 中提取 JWT。
   - 提取后的 JWT 必须同时写入：
     - 全局状态（如 Zustand `useUserProfile` / 专用 auth store），用于内存态即时鉴权；
     - `localStorage`（建议键名：`authToken`），用于刷新后会话恢复。
   - `src/api/_shared/request.ts` 拦截器必须在发往 UserProfile/Vault 微服务的全部请求头自动注入：
     - `Authorization: Bearer <token>`
   - 页面组件严禁手写 Header 拼接，鉴权注入职责必须收敛到 `_shared/request.ts` 的统一请求封装层。

3. **强类型映射与 CamelCase 铁律（Rust JSON 契约对齐）**
   - Rust 侧返回字段默认以驼峰命名输出，前端类型定义必须保持同构，不得擅自转为下划线命名。
   - 示例字段：`errorId`、`needsReview`、`createdAt`、`updatedAt` 等必须按原样保留。
   - `src/api/vault/types.ts` 与 `src/api/user/types.ts` 必须统一复用泛型响应壳：
     ```typescript
     export interface ApiEnvelope<T> {
       code: number;
       data: T;
     }
     ```
   - 严禁使用 `any` 吞噬字段差异；新增字段必须同步更新类型并完成调用侧编译收敛。

4. **写入接口对接清单（Vault Write Contract）**
   - `POST /api/v1/vault/bookmarks`
     - 语义：写入/新增收藏记录（来自知识点、讲解片段、工具产物等）。
     - 前端要求：以强类型 Body DTO 发起请求，成功后按 `ApiEnvelope<BookmarkWriteResult>` 解析并回填列表状态。
   - `POST /api/v1/vault/errors`
     - 语义：写入/新增错题记录（题干、用户答案、正确答案、标签与溯源信息）。
     - 前端要求：请求体字段与 `src/api/vault/types.ts` 严格一致，响应按 `ApiEnvelope<VaultErrorWriteResult>` 解包，不得直接操作裸 `Response`。
   - 双写入接口必须纳入统一错误管线：401（Token 失效）触发登录态回收；4xx/5xx 走全局 Toast 与可重试提示。

### 6. 微服务边界与防线 (Backend Boundary & Fail-Fast Protocol)
1. **黑盒真理源原则**
   - 现有后端服务（含 GoAgents、K2V）属于经过调教的独立工程，前端必须将其视为不可干涉的“黑盒”真理源。
   - 前端 AI 执行端的唯一职责是：严格依据已知 API 契约组装 Payload、发起调用并消费响应。

2. **零越权干预原则**
   - 严禁前端执行端擅自推测后端内部机制、容器拓扑、配置装载流程或文件路径。
   - 严禁在前端仓库中“代写后端修复方案”并冒充真实后端改动。

3. **容器级错误熔断**
   - 当后端返回容器级或系统级错误（如 `[Errno 2] No such file`、配置缺失、启动器崩溃）时，前端执行链必须立即阻断，不得继续叠加前端补丁尝试“绕过”。
   - 必须显式输出阻断结论，并强制挂起当前任务，等待人工进入后端工程目录进行物理排障后再恢复联调。

### 7. 动态画像适配器模式 (Dynamic Profile Adapter Pattern)
- 动态水合 (Dynamic Hydration)：全局 Zustand Store 必须在后台隐式维护 `mastered_knowledge: string[]` 数组。在发起任何跨端 API 请求前，拦截器或 Adapter 层必须将该数组格式化并无缝拼接至用户画像的“补充信息”字段末尾（例：“...该用户已掌握：二分搜索, 冒泡排序”）。
- 异构载荷适配 (Heterogeneous Payload Adaptation)：由于不同后端服务（GoAgents, K2V 等）接收画像的键名存在历史差异（如 `profile_text`, `user_info`, `context` 等），严禁在视图层硬编码拼装。必须在 `api/` 层针对每个微服务编写专用的 Adapter，在请求发出前完成字段映射与动态图谱的注入。

### 8. GoAgents SSE 流式解析铁律 (SSE Parsing Protocol)
- **结果事件真相源**: 所有 goagents 流式接口的最终结果均包裹在 `event: result` 中，前端只允许从该事件的 `data` 字段提取业务结果。
- **强类型反序列化契约**: 针对 `/knowledge-explanation`，解析器必须将 `data` 严格反序列化为以下强类型结构，严禁使用 `any` 推断：
  - `{ markdown: string, mind_map: { root_topic: string, main_branches: Array<{ title, summary, sub_topics }> } }`
- **状态事件解耦**: `running`/`finished`/`failed` 仅用于 UI 状态机驱动，严禁承载最终业务数据解析职责。

### 8. AIGC 物理资产跨维提取法则 (Docker Artifact Salvage Protocol)
当遭遇极端的网络熔断（如 30 分钟以上的高压生成导致前端掉线），但后端 Docker 容器已成功渲染视频时，严禁判定为“生成失败”并重跑算力。必须执行以下标准的物理打捞程序：

1. **高维探测 (Internal Scout)**:
   利用 `docker exec` 进入执行流转的 worker 容器（如 `c2v-worker` 或 `k2v-worker`）进行文件定位：
   ```bash
   docker exec <container_name> find /app -name "*.mp4"
   ```

2. **保真提取 (Fidelity Extraction)**:
   定位到目标路径（如 `/app/data/outputs/videos/[hash].mp4`）后，通过 `docker cp` 将目标文件强行拷贝至宿主机。

3. **绝对红线 (Hash Preservation Redline)**:
   提取时必须 100% 保持视频原本的 Hash 文件名（如 `436fab...c1c.mp4`）。严禁在提取时将其重命名为 `c2v_video.mp4` 或 `test.mp4` 等无语义名称，以此确保跨端数据溯源的绝对唯一性与哈希一致性。

   ```bash
   docker cp c2v-worker:/app/data/outputs/videos/436fab079f75b5315f1189887038fd0faa6e9e5c2376778278bc5bc011a44c1c.mp4 ./436fab079f75b5315f1189887038fd0faa6e9e5c2376778278bc5bc011a44c1c.mp4
   ```

---

## 捌、 鉴权瀑布流与微服务防坑指南 (Auth Waterfall & Microservice Pitfall Playbook)
本章用于固化本轮 UserProfile/Vault 战役的核心经验，作为后续所有成员接入鉴权与新微服务时的入场手册。凡涉及登录态、引导态、跨域代理、Rust 后端联调、接口探针验证等流程，必须先遵守本章。

### 1. 鉴权瀑布流总纲 (Auth Waterfall Single Hub)
1. **唯一枢纽**
   - 全局鉴权路由枢纽必须设在 `src/views/Dashboard/index.tsx`，由该页面掌控阻断态与业务态的唯一分流。
   - `App.tsx` 仅承担路由注册与 Layout 容器分发，不得承担鉴权业务判定，以避免“路由层 + 视图层双判定”导致状态竞争。

2. **三级防线（硬顺序）**
   - 第一门：`!isAuthenticated` 时，必须直接 `return <AuthModal />`。
   - 第二门：`!isProfileComplete` 时，必须直接 `return <OnboardingModal />`。
   - 第三门：仅当上述两门全部通过，才允许渲染 Dashboard 主体（含主控台卡片、侧边栏、业务操作区）。

3. **执行形态（强制 Early Return）**
   - 阻断态必须在组件顶层通过 `early return` 物理切断，不允许以 `z-index` 叠层、遮罩覆盖、`display: none` 隐藏等方式让主业务 DOM 同时挂载。
   - 原因：伪隔离会让业务组件在“不可见状态”下继续执行副作用（请求、订阅、定时器），最终引发资源污染与行为穿透。

4. **禁止 App 级 Onboarding 劫持**
   - 严禁在 `App.tsx` 或高阶路由中引入 `/onboarding` 独立劫持与跳转分支。
   - Onboarding 属于 Dashboard 内部阻断流程，不是站点级新路由。拆成顶级路由会引发回跳复杂度上升、鉴权态割裂、以及 SSR/CSR 切换时状态反复抖动。

### 2. 幽灵状态防御 (Ghost State Defense)
1. **故障复盘**
   - 已发生真实事故：`useAuthStore` 从 `localStorage` 读取 token 时，若读到字符串 `'undefined'`，表达式 `Boolean('undefined')` 返回 `true`，导致未登录用户被误判为已登录（伪阳性）。
   - 同类污染还包括 `'null'` 与空字符串 `''`，会让“是否持有有效 JWT”判断出现幻觉。

2. **铁律**
   - 布尔推导必须建立在“净化后 token”之上，严禁直接对原始 `localStorage` 返回值做 `Boolean(raw)`。
   - 状态恢复流程必须先做字符串黑名单过滤，再做 `!!sanitizedToken` 推导。

3. **推荐实现基线**
   - 净化函数：
     ```typescript
     const GHOST_TOKEN_SET = new Set(['undefined', 'null', '']);

     export function sanitizeStorageToken(raw: string | null): string {
       if (!raw) return '';
       const normalized = raw.trim();
       return GHOST_TOKEN_SET.has(normalized) ? '' : normalized;
     }
     ```
   - 恢复逻辑：
     ```typescript
     const token = sanitizeStorageToken(localStorage.getItem('authToken'));
     if (!token) {
       localStorage.removeItem('authToken');
     }
     const isAuthenticated = !!token;
     ```

4. **防线要求**
   - 每次应用启动、登录恢复、手动刷新 token 后，均必须复用同一套净化逻辑，禁止复制粘贴多套判定代码。
   - 若检测到幽灵状态，必须立即执行 `removeItem` 清库，避免脏值跨会话遗留。

### 3. API 探针测试法 (Minimum Viable Probe)
1. **适用场景**
   - 对接新微服务或高不确定接口时（例如新接 Rust Axum 子域、新增 Vault 资源类型、接第三方引擎回调）。

2. **禁止事项**
   - 严禁“先堆重 UI 再盲调后端”。在链路不稳定前，复杂页面只会放大故障噪音，拖慢定位效率。

3. **标准流程**
   - 在主视图临时挂载最小按钮探针（例如 `ProbeLogin`、`ProbeAddFavorite`、`ProbeAddMistake`）。
   - 探针必须打印全链路关键日志：入参、代理路径、请求头（脱敏后）、响应 code、响应体 data、异常栈。
   - 验证链路顺序必须为：`UI Probe -> Vite Proxy -> Axios/FETCH -> 后端 Controller -> DB`。
   - 仅当探针链路稳定后，方可进入正式 UI 铸造与交互态细节打磨。

4. **交付门槛**
   - 每条新增 API 至少保留一条可复用探针脚本或临时组件，直到联调完成并通过回归后再清理。
   - 遇到 401/403/422/500 等关键状态码必须在探针期完成“分类处理策略”定义，禁止带着未知错误语义进入产品 UI。

### 4. Rust/SQLx 编译期降维打击 (SQLx Macro Bypass)
1. **问题背景**
   - Rust Axum + SQLite 联调阶段，`cargo check` 会对 `sqlx::query!` 宏执行编译期数据库校验。
   - 当环境缺失 `DATABASE_URL`（或本地 schema 不可达）时，编译直接被卡死在宏展开阶段，导致前端联调窗口被迫中断。

2. **处置策略**
   - 在未具备完整编译期数据库环境前，允许将宏调用从：
     - `sqlx::query!(...)`
   - 降级为运行期绑定：
     - `sqlx::query(\"...\").bind(...).bind(...)`
   - 目标是先打通编译与联调链路，再在条件成熟时回迁宏校验。

3. **使用边界**
   - 该策略只用于“联调期编译阻塞解锁”，不代表永久放弃类型校验。
   - 一旦 CI 或本地开发环境补齐 `DATABASE_URL` 与 schema 管理，应评估是否回迁到 `query!` / `query_as!` 获得更强编译期安全。

4. **与前端协作纪律**
   - 前端在遇到此类后端编译期阻塞时，不得臆测 SQL 字段或自造后端补丁方案。
   - 必须先记录“后端因 `DATABASE_URL` 缺失导致宏阻塞”的事实，再采用最小可行 API 探针验证接口可达性。

### 5. 快速检查清单 (Onboarding Checklist for New Members)
1. 是否将 Auth 枢纽固定在 `Dashboard/index.tsx`，并采用三级 Early Return？
2. 是否完全移除 `App.tsx` 中的 `/onboarding` 劫持逻辑？
3. 是否对 `localStorage` 读取值执行了幽灵状态净化与清库？
4. 新 API 是否先走按钮探针，再进入复杂 UI？
5. Rust/SQLx 是否因环境缺失触发宏阻塞，且已按策略降级并留档？

---

## 玖、 动态知识追踪与自适应引擎 (Dynamic Knowledge Tracing & Adaptive Engine)
本项目已由静态表单驱动，全面升维为伴随用户生命周期迭代的动态学习系统。所有相关业务流必须严格遵循以下状态机规范：

### 1. 核心画像采集提权 (Profile Input Elevation)
- 字段重构：原“补充信息”字段提权为系统级核心驱动引擎，UI 强制更名为 **“学习目标和补充信息”**。
- 强制性约束：物理删除界面的“选填”暗示。必须提供高质量的 Placeholder 范式（如：“我想学完python的基础内容，我数学能力强，编程能力弱”），引导用户提供系统级上下文。

### 2. 自适应测验状态机 (Adaptive Quiz State Machine)
- 动态容量规划：废除硬编码题量。学前测的题量必须由 AI 根据用户画像动态生成与裁定，严格限定在 **10 至 40 题** 的柔性区间内。
- 强制置信度拦截 (Confidence Gate)：在渲染层，进入“下一题”前必须强制挂载元认知评估。用户必须在 **[我不会]**、**[我不确定]**、**[我会]** 中做出绝对的单选，否则下一题的路由/动作处于绝对死锁 (Disabled) 状态。
- 最高优先级熔断器 (Early Exit Circuit Breaker)：测验全局必须常驻 **[结束]** 按钮。该动作具有最高优先级，允许用户在任意节点强行中断测验。中断后，系统必须启动兜底机制，基于当前已收集的残缺画像和答题数据，直接下发学习计划生成请求。

### 3. 极严苛的“掌握”定义 (Strict Mastery Logic)
- 知识图谱的节点点亮（即推入 `mastered_knowledge` 数组）必须满足极其苛刻的双重校验：
  - 学前测判定：`isMastered = (自信度 === '我会') && (答案 === 纯正正确)`。严禁将瞎蒙（我不确定+正确）计入掌握状态。
  - 学习期拓展：在知识点详情页，必须由用户显式触发“学习完毕”事件，方可派发图谱更新动作。每次掌握新节点，必须实时触发全栈画像的水合与更新。

### 🎯 状态拓扑更新 (State Topology) - 2026-03-07
* **3D 沙盒模块 (Sandbox3D)**：已进入“完全体”状态。脱离独立测试期，成功接入微服务级画像大动脉。具备实时响应 UI 动态难度 (`difficulty`)、持久化历史记录 (`localStorage`) 以及语义化封面生成的能力。
* **学前测与动态知识图谱 (Pretest & Knowledge Graph)**：修复了数据截断萎缩 Bug。现已建立“前端作答 -> 底层知识点 (knowledge_point) 提取 -> Zustand 全局图谱注水 (`addMasteredNode`) -> 聚合为 profile_text -> Go 网关透传 -> LLM / 3D 引擎感知”的完美数据闭环。

### 🔄 版本增量台账 (Delta Log) - 2026-03-07
* **重构**：`generate.ts` 中的 `adaptSandbox3DPayload` 适配器。消除所有前端臆想字段与硬编码，严格映射 `useUserStore` 的真实画像字段（age, language, duration），并将学习补充与已掌握知识点精准缝合为 `learningGoal`。
* **重构**：`PretestBoard/index.tsx` 中的 `normalizeQuestions` 函数。打破数据截断漏斗，强行穿透 `knowledge_point` 与 `correct_answer`，并在结算时激活基于前缀匹配的掌握度判定逻辑。
* **修复**：纠正了 `useUserStore.ts` 中关于 `language` 字段的注释投毒（明确为编程语言而非界面语言）。
* **贯通**：`Sandbox3D/index.tsx` 组件成功挂载 `useUserStore`，打通了“入门/中等/专精”的真实物理传参链路。

---
