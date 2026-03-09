# 🤖 GEMINI.md - 本地 AI 执行端最高宪法 (The AI Constitution)

适用对象: 本地所有 AI Coding Agent 
执行优先级: 最高 (Override All)。本文件是项目 AI 辅助开发的唯一行为准则与架构真理源。AI 在生成任何代码前，必须优先读取并绝对服从本文件。具体业务逻辑、API 契约与目录规范请参阅 `PROJECT.md`。

---

## 零、 绝对红线 (The Absolute Red Lines) 🚨

1. 环境与路径隔离: 必须且只能使用 Linux 绝对路径或以 `~/` 开头的相对路径。严禁在代码、配置文件或终端操作中生成任何 Windows 风格的反斜杠路径 (`C:\...`) 或 WSL 跨界挂载路径 (`/mnt/c/...`)。
2. 零猜测铁律 (Zero Speculation): 严禁臆测任何未确定的环境参数、API 字段、版本号、文件路径或业务意图。遇到模糊点，必须立刻停止执行并向用户提问：“请确认 [具体参数/意图]”。宁可多问，不可错做。
3. 破坏性操作熔断 (Destructive Operations): 在执行核心文件的全盘覆盖、大规模重构或删除操作前，必须先简述方案，并等待用户回复“确认执行”后方可继续。
4. 全中文回复: 无论用户的 Prompt 语言为何，代码解释、架构分析、日常交互强制使用中文（简体）。
5. JSON 纯净原则: 🛑 极其重要：标准的 `.json` 文件内严禁包含任何形式的注释 (`//` 或 `/* */`)，否则将导致解析崩溃！如必须写注释，请修改为 `.ts`/`.py` 配置或使用 `.jsonc`。
6. 后端零猜测铁律: 前端仅作为调用方，严禁对后端服务内部机制、端口或配置文件进行任何假设或自主生成后端代码。遇到后端报错，立刻停止工作并交由人类指挥官查证。
7. 配置文件增量防线 (Incremental Config Law): 在修改 `vite.config.ts`、`src/config/api.ts` 或路由表等系统胶水层时，必须严格执行“最小化增量追加 (Append Only)”，绝对禁止全盘覆写、删除或覆盖既有代理规则。

---

## 壹、 核心编码与生成规范 (Code Generation Protocol)

1. 增量与精准开发 (Incremental & Targeted): 禁止盲目覆盖。生成代码前必须先读取现有文件，识别缺失模块，仅针对目标路径（如 `aider-dmx src/api.ts`）精准生成，防止附带损害。
2. 代码质量与类型安全 (Quality & Type Hinting): 所有新增 TypeScript/JavaScript 必须具备严谨的 Type Hinting。核心逻辑与 Props 强制使用中文注释。依赖包默认使用当前最新 Stable 版。
3. 闭环测试与修复 (Implement and Test Closure): 若用户提供了 Traceback 报错日志，AI 必须直接摄入日志，精准定位并进行自动化修复，直至测试通过。

---

## 贰、 UI/UX 与样式架构底线 (Aesthetic & UI/UX Rules)

1. 变量驱动与微拟态 (Token-Driven & Neumorphism): 
   - 彻底封杀纯黑色 (`#000000` / `rgba(0,0,0,X)`) 的投影或边框。
   - 强制使用 CSS Variables (如 `var(--bg-canvas)`) 进行色彩映射。
   - 卡片和交互态必须使用微拟态光影（`--shadow-soft`, `--shadow-hover`）替代死板的 border。
2. 8pt 绝对网格与排版 (The 8pt Grid Strict Mode): 涉及间距、圆角的数值必须是 8 的倍数 (8, 16, 24, 32等)。严禁生成 5px、10px 等非标数值。代码区块强制绑定等宽字体与 `--code-bg`。
3. 3D 资产与 Iframe 隔离: 涉及 3D 模型的产物，必须使用 `<iframe src="...">` 标签作为物理沙盒加载绝对路径，绝对禁止用 React 组件硬解析 3D 源码。
4. 🛑 异构渲染色值降维铁律 (Canvas/WebGL Color Protocol): 在处理 ECharts、Three.js 等底层异构渲染引擎配置时，严禁使用 CSS 变量（极易静默透明），必须且只能使用绝对 Hex 物理色值（如 `#2C1608`）。

---

## 叁、 状态机与数据流管线 (State Machine & Data Pipeline)

1. 状态机纯洁性与隔离铁律 (State Purity & Persist Isolation):
   - 严禁状态孤岛：跨页面核心业务数据（如 AI 生成状态、学习图谱）必须通过 Zustand `useUserStore` 统筹读写，严禁组件内局部的 `useState`。
   - 🚨 **不可序列化对象物理隔离（致命红线）**：`AbortController`、`WebSocket`、`Blob/File` 等浏览器原生内存指针，绝对严禁被 Zustand 的 `persist` 中间件拦截写入 `localStorage`！开发 AI 异步引擎时，必须在 Store 中实施内存运行池与持久化资产池的双轨分离机制，违者将导致应用无限期白屏崩溃。
   - 🚨 状态机持久化防爆隔离红线 (Persistence Partialize Shield)：任何被 Zustand persist 中间件接管的 Store，如果内部引入了浏览器原生对象、内存指针、Socket 实例或 AbortController 等不可序列化的挥发性内存数据，必须且只能使用 partialize 函数进行显式物理拦截剔除 (Omit)。严禁让其流入 localStorage 触发全站白屏灾难！
2. 渲染管线排他律 (Early Return Pipeline): 处理鉴权、Onboarding 等阻断态时，必须在 React 组件顶层使用 `early return` 进行物理切断，严禁使用 `z-index` 或 `display: none` 进行伪隔离。
3. 存储幽灵态净化 (Storage Sanitization): 从 `localStorage` 读取状态时，必须显式拦截并清除字符串幽灵（`'null'`、`'undefined'`、`''`），净化后再做布尔推导，防范伪阳性鉴权。
4. 流式消费与媒体穿透 (SSE & Blob Proxy): 
   - SSE 生成类接口必须使用 Fetch API 配合流处理器，妥善暴露出 `onMessage/onError/onComplete`。面对超长耗时任务，禁止对非致命事件过度反应切断 Fetch。
   - 鉴权媒体资源严禁将 URL 直绑 `<video src>`。必须由 API 层提供拦截器，以 Fetch 拉取二进制流后转换为 `URL.createObjectURL(blob)` 安全渲染。
5. 异构载荷强类型适配 (Heterogeneous Payload Adaptation): 对接非同源的独立后端微服务时，严禁将前端的全局 UserProfile 状态直接扔给 API。必须在 `src/api/` 层编写专用 Adapter 函数，按目标契约执行字段重组、拍平与防幻觉降噪。

---

## 肆、 Git 提交流程与原子化控制 (Git Protocol)

由于 Agent 被配置为阻断自动提交 (`--no-auto-commits`)：
1. 手动控制权: 代码修改与联调通过后，必须由人类指挥官手动执行 `git add .` 与 commit。
2. Commit 规范: 生成的 Commit Message 必须为全中文，遵循 `<Type>: <Description>` 格式（例：`feat: 增加主控台每日计划模块卡片渲染`，`fix: 修复跨页面切换时状态丢失`）。
