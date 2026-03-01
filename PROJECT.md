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
## 陆、 GoAgents 后端协同时代 (Backend Integration & SSE Flow)
### 1. 全局用户画像状态树 (Global User Profile State)
前端必须建立一个强类型的全局状态中心（推荐 Zustand），用于存储与管理统一用户画像（User Profile）。
- **核心字段**: 年龄 (age)、偏好语言 (language)、总学习周期（决定计划的天数/阶段数） (study_duration)、补充信息 (supplements)。
- **注入拦截**: 在发起 `/studyplan`, `/pretest` 等核心业务请求前，API 拦截器或 Service 层必须自动从状态树中提取并组装这些画像数据，严禁在 UI 组件中散落拼凑。

### 2. SSE 响应式流处理机制 (Server-Sent Events)
由于后端核心能力（学习计划、测试、知识讲解等）均基于大语言模型且采用 SSE 流式返回，前端严禁使用传统的阻塞式 Axios 请求处理大段文本。
- **状态机映射**: 前端必须精确捕获并映射后端的四个流状态事件：`running` (UI 展示骨架屏或打字机前置动效) / `finished` (UI 结算与卡片固化) / `failed` (UI 降级提示与重试逻辑) / `result` (增量或全量数据块)。
- **技术栈选型**: 推荐基于原生 `fetch` API 结合 `ReadableStream` 进行二次封装，或者使用 `@microsoft/fetch-event-source` 处理复杂的流式通信。

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

### 3. 跨领域数据交互规约 (Cross-Domain Data Interaction)
* 当一个页面/组件需要同时消费多个微服务的数据时，必须在 UI 层（Page/Container 组件或自定义 Hook）中分别调用各领域的 Service 函数，再在本地进行数据组装。
* **严禁**在任何单一领域的 Service 文件中发起对其他领域后端接口的请求。
* 若遇到后端已提供聚合接口（BFF 层）的情况，该聚合接口应归属于调用方的领域目录，或单独建立 `~/src/api/bff/` 目录管理。

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
