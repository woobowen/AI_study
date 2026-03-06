# 🤖 GEMINI.md - 本地 AI 执行端最高宪法 (The AI Constitution)
**适用对象**: 本地所有 AI Coding Agent 
**执行优先级**: 最高 (Override All)。本文件是项目的唯一真理源，包含技术栈规范、目录结构、编码准则和 API 规范。AI 在生成任何代码前，必须优先读取并绝对服从本文件。

---

## 零、 绝对红线 (The Absolute Red Lines) 🚨
1. **环境与路径隔离**: 必须且只能使用 Linux 绝对路径或以 `~/` 开头的相对路径。严禁在代码、配置文件或终端操作中生成任何 Windows 风格的反斜杠路径 (`C:\...`) 或 WSL 跨界挂载路径 (`/mnt/c/...`)。
2. **零猜测铁律 (Zero Speculation)**: 严禁臆测任何未确定的环境参数、API 字段、版本号、文件路径或业务意图。遇到模糊点，必须立刻停止执行并向用户提问：“请确认 [具体参数/意图]”。宁可多问，不可错做。
3. **破坏性操作熔断 (Destructive Operations)**: 在执行核心文件的全盘覆盖、大规模重构或删除操作前，必须先简述方案，并等待用户回复“确认执行”后方可继续。
4. **全中文回复**: 无论用户的 Prompt 语言为何，代码解释、架构分析、日常交互强制使用中文（简体）。
5. **JSON 纯净原则**: 🛑 极其重要：标准的 `.json` 文件内严禁包含任何形式的注释 (`//` 或 `/* */`)，否则将导致解析崩溃！如必须写注释，请修改为 `.ts`/`.py` 配置或使用 `.jsonc`。
6. **后端零猜测铁律**: 前端仅作为调用方，严禁对后端服务（如 GoAgents、Knowledge2Video 的内部机制、端口、配置文件）进行任何假设、猜测或自主生成后端代码。遇到前后端不匹配或后端底层报错，必须立刻停止工作并明确告知用户，交由用户前往后端代码库进行物理查证。
7. **配置文件增量防线 (Incremental Config Law)**: 在修改 `vite.config.ts`、`src/config/api.ts` 或路由表等系统级胶水层文件时，严禁使用“全盘覆写”或“主观删减”。必须严格执行“最小化增量追加 (Append Only)”，绝对禁止删除或覆盖任何既有的代理规则或路由配置，否则将导致毁灭性的网关断层。

---

## 壹、 核心编码与生成规范 (Code Generation Protocol)

### 1. 增量与精准开发 (Incremental & Targeted)
* **禁止盲目覆盖**: 生成代码前必须先读取现有文件，识别缺失模块，**仅针对该模块生成代码**。
* **路径收束**: 用户的启动指令将明确传递目标文件路径（如 `aider-dmx src/api.ts`），请将注意力严格收束在该目标内，防止对其他文件造成附带损害 (Collateral Damage)。

### 2. 代码质量与类型安全 (Quality & Type Hinting)
* **强类型约束**: 所有新增的 TypeScript/JavaScript 代码必须具备严谨的 Type Hinting (接口、类型别名、泛型)。
* **中文注释**: 核心业务逻辑、状态流转、复杂算法和公共组件的 Props，必须且只能使用**中文注释**。
* **版本策略**: 严禁硬编码旧版依赖号，始终默认使用当前时间点最新的稳定版 (Stable) 或 SOTA 模型/工具。若项目已存在 `package.json`，必须先读取以保持版本一致性。

### 3. 闭环测试与修复 (Implement and Test Closure)
* 代码编写完成后，若用户提供了 Traceback 报错日志，AI 必须直接摄入该日志，精准定位并进行自动化修复，直至测试通过。

---

## 贰、 UI/UX 与样式架构规范 (Aesthetic & UI/UX Rules)
作为顶级前端架构师的执行手，你生成的 UI 代码必须吻合以下美学纪律：

### 1. 变量驱动与微拟态 (Token-Driven & Neumorphism)
* **禁用纯黑**: 样式体系中彻底封杀纯黑色 (`#000000` / `rgba(0,0,0,X)`) 的投影或边框。
* **强制变量化**: 背景色、文本色、边框必须调用 `PROJECT.md` 中约定的 CSS Variables (如 `var(--bg-canvas)`, `var(--text-primary)`, `var(--color-info-bg)`)。
* **Z 轴光影**: 卡片和交互态必须使用微拟态光影（`--shadow-soft`, `--shadow-hover`, `--shadow-inner`）替代死板的 `border`。

### 2. 8pt 绝对网格与排版 (The 8pt Grid Strict Mode)
* 所有涉及间距 (margin, padding, gap, top/left) 和圆角 (border-radius) 的数值，**必须是 8 的倍数** (8, 16, 24, 32, 40, 48, 64等)。严禁生成 5px、10px、15px 等非标数值。
* 代码展示区块强制绑定等宽字体集 (`Fira Code`, `JetBrains Mono`, `monospace`) 并挂载专属背景色 `--code-bg`。

---

## 叁、 Git 提交流程与原子化控制 (Git Protocol)
由于 Aider 被配置为 `--no-auto-commits`（阻断自动提交），你的工作流程如下：
1. **手动控制权**: 代码修改完毕并经用户本地验证/测试通过后，由用户手动执行 `git add .` 与 commit。
2. **Commit 规范预设**: 如果用户要求你生成 Commit Message，必须为全中文，并遵循 `<Type>: <Description>` 格式。
   * 例: `feat: 增加主控台每日计划模块卡片渲染`
   * 例: `fix: 修复路由切换时 AI 侧边栏状态丢失的问题`
   * 例: `refactor: 依据 8pt 网格规范重构知识点下钻页`

---

## 肆、 Project Warm-Parchment 专属业务铁律 (Domain Rules)
1. **在线 IDE 降级防御**: 若遇到涉及“在线编程平台 (IDE)”的开发，必须检查 `ENABLE_ONLINE_IDE` 开关。在开启前，强制将其渲染为 Disabled 状态（扫描线 + Badge + pointer-events: none），或在点击时实施前端事件劫持 (`e.preventDefault()`) 并触发全局 Toast，严禁执行路由跳转。
2. **AI 侧边栏保活**: 在主控台 (`/dashboard`) 与下钻页 (`/node/:id`) 间切换时，由于其共享 80/20 分栏 Layout，AI Chat 组件严禁被卸载，必须通过顶层状态管理保持对话上下文不中断。
3. **节点状态机铁律**: 开发 `/node/:nodeId` 视图时，必须将底部的测试与分发模块（Card 5）视为独立的状态机组件。严禁将这部分复杂的渲染逻辑与上方的静态知识展示面条式地混写在一起，必须解耦。
## 伍、 数据流与接口铁律 (Data Flow & API Protocol)
1. **用户画像强制耦合**: 在编写任何涉及调用后端 LLM 接口（如生成学习计划、学前测、知识点讲解）的 Service 函数时，AI 必须自动从全局 Store (Zustand) 获取用户画像上下文并合并到 Request Payload 中。
   🚨 新增红线：在组装 Payload 之前，必须从 Store 中提取已掌握的知识点数组 (mastered_knowledge)，将其动态格式化并追加到画像的补充信息字段末尾。
2. **SSE 流式消费**: 在生成 API 请求代码时，遇到生成类接口，强制使用 Fetch API 处理 Server-Sent Events 流，并暴露出 `onMessage`, `onError`, `onComplete` 等回调函数供 UI 层使用，严禁将其当作普通 Promise 处理。
3. **媒体鉴权穿透铁律**: 前端任何 `<video>` 或 `<audio>` 标签，若目标资源受后端的 `X-API-Key` 保护，严禁直接绑定网络 URL 字符串。必须在 API 层封装专门的 Fetch Blob 转换函数，通过浏览器内存对象 (`URL.createObjectURL`) 安全渲染。
4. **环境对抗铁律**: 永远不要假设所有本地微服务都配置了完美的 CORS。当遇到后端缺乏跨域支持时，前端框架师的首选动作是配置开发环境代理 (`vite proxy`)，而不是去盲目修改不属于当前战役边界的后端工程。
5. **多引擎异构响应防御**: 前端 API 层必须严格区分不同后端的响应外壳。GoAgents 使用 SSE 事件流，而 UserProfile（Rust）使用标准的 `{code, data}` JSON 外壳。严禁使用单一的 Response 泛型强套所有微服务。
6. **渲染管线排他律 (Early Return Pipeline)**: 在处理 Auth（鉴权）与 Onboarding（前置引导）等核心阻断态时，严禁使用 `z-index` 叠层或 `display: none` 的“视觉隔离伪方案”。必须在 React 组件顶层使用 `early return` 进行物理级渲染切断，确保阻断态与主业务视图不会同帧并存。
7. **本地存储类型净化律 (Storage Sanitization)**: 从 `localStorage` 读取鉴权与引导状态时，严禁直接作为 Boolean 判定。必须显式拦截并清除字符串幽灵状态（`'null'`、`'undefined'`、`''`），统一在净化后再进行布尔推导，防止 `Boolean('undefined') === true` 导致伪阳性鉴权。
8. **长连接状态机韧性 (Hypersensitive Circuit Breaker Defense)**: 在处理耗时极长（如30分钟以上）的 SSE 生成任务时，前端严禁对非致命事件（如 failed/error 发出的 503 重试警告）过度反应。绝对禁止在 onError/onFailed 回调中将 isGenerating 设为 false 或抛出 Error 切断 Fetch 流。只有在收到最终的 result 事件或外层 catch 捕获到真实的物理断网时，才允许释放 UI 锁定态。
9. **异构引擎组装意识**: 在向后端发送 Payload 时，必须先判定目标引擎类型。若是 Go 引擎（GoAgents），画像字段必须扁平化映射为 `profile_text`；若是 Python 引擎（K2V/C2V），必须映射为 `extra_info`。严禁盲目复制组装逻辑。

---

## 核心微服务契约 (GoAgents API Schema)
以下三条规则为与 GoAgents 微服务通信时的绝对真理，任何 AI Agent 在生成相关代码时必须无条件遵守。

### 1. 画像结构铁律 (Profile Payload Schema)
所有向 GoAgents 发送的画像数据**必须是扁平化的一级字段**，结构如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `age` | `number` | 用户年龄 |
| `gender` | `string` | 用户性别 |
| `language` | `string` | 学习语言 |
| `duration` | `string` | 总学习周期（决定计划的天数/阶段数） |
| `profile_text` | `string` | 画像描述文本 |

* 🚨 **绝对禁止**将上述字段嵌套在 `userProfile`、`profile` 或任何包装对象中。
* 🚨 **绝对禁止**臆想添加 `subject`、`context` 或任何规范外的额外字段。
* 🚨 动态追踪提权：原“补充信息”字段现已升级为动态知识图谱的载体，UI 层必须体现为“学习目标和补充信息”，严禁出现“选填”字样。前端请求时，必须将该用户的动态掌握进度（如“已掌握：xxx”）拼接至该字段内。

### 2. 流式通信铁律 (SSE Event Contract)
GoAgents 返回的 SSE 状态事件**仅包含以下五种**，不存在其他事件类型：

| 事件名 | 含义 |
|---|---|
| `running` | 任务执行中 |
| `finished` | 任务已完成 |
| `failed` | 任务失败 |
| `result` | 携带最终结果数据 |
| `error` | 携带错误信息 |

* 前端**必须且只能**从 `result` 事件的 `data` 字段中提取最终数据。
* 严禁从 `finished` 或其他事件中解析业务数据。

### 3. 路由铁律 (Endpoint Path Contract)
* **严禁**在请求路径后臆想拼接 `/generate` 或任何其他后缀。
* **严格使用**GoAgents 提供的原生路径，如 `/pretest`、`/studyplan` 等。
* 示例：正确 → `POST /pretest`；错误 → `POST /pretest/generate`。

### 4. 自适应状态机红线 (Adaptive State Machine)
* 学前测容量：严禁硬编码题量，必须基于画像动态生成 10-40 题。
* 置信度拦截：学前测渲染层必须强制校验置信度（我会/不确定/不会），未选择严禁进入下一题。
* 掌握判定铁律：仅当 (自信度 === '我会') 且 (答案 === 正确) 时，才允许向 mastered_knowledge 图谱中推入该知识点。
* 熔断机制：学前测必须全局常驻 [结束] 按钮，允许随时中断并基于残缺数据生成计划。

---

## 陆、 AIGC 工具组与 K2V 微服务契约
1. **鉴权红线**：调用 K2V 接口必须携带 `X-API-Key`，严禁裸奔调用。
2. **端口隔离铁律**：前端代码严禁硬编码端口号，必须依赖 `API_PREFIX.K2V` 和 Vite 反向代理。
3. **载荷语义隔离**：K2V 接口的 `duration` 单位是“视频分钟数”（1-30），与 GoAgents 的“学习周期天数”截然不同，严禁混淆！
4. **视图隔离铁律**：K2V 开发绝对禁止引入 Dashboard 的 80/20 分栏布局，必须使用 100vw 沉浸式容器。
