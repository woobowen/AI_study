# 🔄 研发交接快照 (CURRENT.md / HANDOFF)
**生成时间:** 2026-03-01
**当前所处分支:** `current`
**项目代号:** Project Warm-Parchment (AI_study)
**定位:** 本文档用于在跨会话、切换底层工具链 (Gemini Web ⇌ Aider/OpenCode) 时，为 AI 提供极其精确的上下文边界与下一步执行路径。AI 在启动后必须优先阅读此文件。

---

## 壹、 宏观架构状态 (Macro State)
- **前端基建 (Vite + React + TS):** 运行于 `~/project/AI_study`。全局样式底座 (微拟态 Neumorphism、8pt 网格)、Vite 反向代理 (指向 `http://127.0.0.1:8080`) 已全部就绪。
- **微服务引擎 (GoAgents LLM Gateway):** 运行于 `~/project/goagents/goagents`，Docker 容器 (`my-goagents`) 已挂载并监听 `8080` 端口。底层大模型已切换为纯 JSON 输出最稳定的模型 (如 `claude-3-5-sonnet`)。
- **核心契约确立:** 已在 `GEMINI.md` 与 `PROJECT.md` 中彻底固化「扁平化请求字段 (Flattened Profile)」、「SSE 响应式流处理」与「防 React 闭包闪退」三大架构铁律。

---

## 贰、 刚才的增量变更 (Recent Incremental Changes)
**里程碑: 学前测 (Pretest) E2E 全链路贯通与 UI 闭环。**
1. **API 路由与契约对齐:** - 修复了 `src/api/goagents/index.ts` 中臆想的 `/generate` 后缀，对齐原生路径 `/api/llm/pretest` 与 `/api/llm/studyplan`。
   - 重构了 `src/api/goagents/types.ts`，彻底扁平化画像级请求参数 (`age`, `gender`, `language`, `duration`, `profile_text`)。
2. **底层流式通信装甲 (`src/api/sseClient.ts`):** - 接入了严格基于 `event:` 字段的解析器。
   - 实现了对 `event: failed` 和 `error` 的致命错误阻断，并抛出自定义 `SSEBusinessError`。
   - 修复了对最终结果 `event: result` 的深层嵌套解构逻辑 (`parsed.result ?? parsed`)。
3. **UI 状态机重构与闭包陷阱防御 (`src/views/Dashboard/components/OnboardingModal.tsx`):**
   - 确立了 `form` -> `generating` -> `quiz` 的严谨状态流转。
   - **重大修复:** 移除了 `onComplete` 阶段基于过时 State 的强制回退逻辑，将状态驱动完全收敛于 `onData`，彻底解决 React 异步闭包导致的 UI 闪退。
   - **UI 竣工:** 完成了毛玻璃质感的学前测答题卡片渲染，实现了单选高亮、题目防溢出与“下一题/完成测验”的完整交互链路。

---

## 叁、 极其详细的下一步开发计划 (Next Actionable Steps)
**当前战役目标: 打通并渲染「学习计划生成 (Study Plan)」模块**

前端 `OnboardingModal.tsx` 在用户点击“完成测验”后，已重置了表单。现在的核心任务是，当用户确认基础信息或学前测结果后，向微服务请求真正的「学习计划」，并在 Dashboard 或专属视图中渲染计划树。

### 执行路径分解 (Execution Path)

**Step 1: 联调学习计划生成接口 (API Integration)**
- **目标文件:** `~/project/AI_study/src/api/goagents/index.ts` 与业务层 Store/组件。
- **任务:** - 确认 `fetchStudyPlan` 函数能够正确打包扁平化的 Profile 数据并发起 POST 请求。
  - 确认能否正确解析 GoAgents 阶段 1 (画像分析) -> 阶段 2 (计划生成) -> `event: result` 的数据流。
  - 返回的预期 JSON 结构为包含 `stages` 的数组（如 `[{ stage_name: "第1天", knowledge_points: [...] }]`）。

**Step 2: 建立学习计划数据流与 Store 挂载 (State Management)**
- **目标文件:** `~/project/AI_study/src/store/useStudyPlan.ts` (需新建或确认存在)。
- **任务:** 接收底层解析出的 `stages` 数据，将其持久化至 Zustand Store，使其脱离单一组件的生命周期，供全局 Dashboard 消费。

**Step 3: 学习计划 UI 骨架渲染 (UI Implementation)**
- **目标文件:** `~/project/AI_study/src/views/Dashboard/components/DailyPlanGrid.tsx` (或新规划的组件路径)。
- **任务:** - 抛弃原有的 MOCK_DAYS 假数据。
  - 读取 Store 中的真实大模型生成计划。
  - 严格遵守 `PROJECT.md` 中定义的 **8pt 绝对网格** 与 **微拟态光影系统 (`--shadow-soft`)**，渲染出带时间轴或卡片矩阵风格的“每日学习规划”。
  - 确保卡片附带平滑的 Hover 态光影过渡。

### 🚨 AI 执行防偏红线 (Guardrails for Agents)
- **防幻觉警告:** 在处理 `/studyplan` 返回的 JSON 解析时，必须事先使用 `console.log` 探明真实的嵌套深度，严防 `undefined.map` 崩溃。
- **文件只读策略:** 绝不允许未经授权大范围修改或覆盖已跑通的 `sseClient.ts` 或 `OnboardingModal.tsx`，必须严格采用**增量开发**。