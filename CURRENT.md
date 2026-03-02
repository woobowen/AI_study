# 🔄 研发交接快照 (CURRENT.md / HANDOFF)
当前战役: 动态知识追踪与自适应学习引擎重构 (Dynamic Knowledge Tracing & Adaptive Engine)
宏观状态: K2V 视频生成全链路已完美竣工并合并至 main 分支。当前系统正从“静态画像表单”向“伴随式动态图谱”进行底层升维。
执行纪律: 严格遵循自底向上（状态机 -> 视图层 -> 适配器 -> 后端勘探）的原子化重构顺序，每一步必须独立测试闭环。

---

## 极其详细的下一步开发计划 (Next Actionable Steps)

### 阶段一：图谱中枢与画像入口改造 (Store & Onboarding)
- [ ] **目标 1：Zustand 图谱中枢**。在 `src/store/` 中扩展用户状态（或新建 `useKnowledgeGraph.ts`），显式维护 `mastered_knowledge: string[]` 数组，并暴露 `addMasteredNode(node: string)` 动作。
- [ ] **目标 2：入场表单 (Onboarding) 提权**。修改画像填写页 UI，将“补充信息”物理更名为“学习目标和补充信息”，彻底删除“选填”字样。
- [ ] **目标 3：高质量 Prompt 占位符**。为该输入框注入标准范式占位符（如：“我想学完python的基础内容，我数学能力强，编程能力弱”），强制引导用户建立系统级上下文。

### 阶段二：学前测视图层爆改 (Adaptive Quiz UI & Logic)
- [ ] **目标 1：最高优先级熔断器**。在 Quiz 组件全局悬浮或顶部注入 **[结束]** 按钮。点击时无条件中断当前测验，直接携带当前已搜集的残缺画像与答题记录，触发 `/studyplan` 学习计划生成。
- [ ] **目标 2：强制置信度拦截网**。在原有的选项列表与“下一题”按钮之间，插入置信度单选组：`[我不会]`、`[我不确定]`、`[我会]`。未选择置信度时，“下一题”按钮必须强制 Disabled。
- [ ] **目标 3：双重校验与图谱点亮**。在用户点击“下一题”的事件回调中注入拦截逻辑：如果该题答对 且 置信度为 `[我会]`，立刻提取该题的知识点 Tag，调用 Store 的 `addMasteredNode` 推入全局图谱。

### 阶段三：大模型 Prompt 与后端接口适配 (Backend Hydration & Exploration)
- [ ] **目标 1：动态画像适配器 (Hydration Adapter)**。在前端 `src/api/_shared/request.ts` (或对应的调用层) 注入拦截逻辑：在发送画像 Payload 前，读取 `mastered_knowledge` 数组，若不为空，则自动将其拼接到“补充信息”字段末尾（格式：“... [系统注入]该用户已掌握：xxx, yyy”）。
- [ ] **目标 2：测验容量动态化 (10~40题)**。排查前端发往 GoAgents 的 `/pretest` 请求载荷，看是否支持传入 `question_count` 参数。如果前端无控制权，必须立刻停止前端迭代，生成后端物理勘探指令，去 GoAgents 源码中修改生成学前测的系统提示词（System Prompt），要求其根据画像动态决定 10-40 的题量。
- [ ] **目标 3：跨服务字段名映射**。清查 GoAgents 与 K2V 接收画像的准确键名（如 `profile_text` 与 `context` 的差异），在请求体组装时实施极其精准的字段映射，严禁错发漏发。
