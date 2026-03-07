# CURRENT.md - 当前迭代周期战术板

## 当前阶段目标：K2V 沉浸视界后端点火 (Python Engine Integration)
**任务描述**：前端 `NodeK2VBlock` 目前使用 `setTimeout` 的假点火装置。下一战役必须将其物理接驳至真实的 Python 视频流媒体/后端接口。

## 任务清单 (Task Checklist)
- [ ] **探路 (Scout)**：侦察后端 K2V 接口的真实 API 签名（Endpoint、请求 Method、入参结构、出参视频 URL 或流数据格式）。
- [ ] **铸模 (Mold)**：建立 Axios/Fetch 响应拦截与错误处理机制，定义 `K2VResponse` TypeScript 接口。
- [ ] **执行 (Execute)**：替换 `NodeK2VBlock` 中的 `setTimeout`，注入真实的异步获取逻辑，并处理 `running` (高维空间降维中) -> `finished` (挂载真实视频源播放) -> `failed` (降维失败重试) 的完整状态机。

## 执行路径 (Execution Path)
1. **目标文件**：`~/project/AI_study/src/views/KnowledgeNode/components/NodeK2VBlock.tsx`
2. **预期数据结构**：基于 `knowledgePoint` (如 "变量与数据类型") 和全局 `userProfile` (Python，7天等) 发起请求。
3. **验证逻辑**：
   - 请求发起时，UI 必须锁定在“正在从高维空间降维视频流...”的 Loading 骨架。
   - 请求成功后，渲染极其精致的深色焦点播放器（带有我们刚设计的微拟态 UI），并注入真实的 `<video src={...}>`。
   - 必须处理 AbortController，防止 React 严格模式下的二次渲染导致并发污染。
