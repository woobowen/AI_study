# 🔄 研发交接快照 (CURRENT.md / HANDOFF)
**当前战役:** K2V (Knowledge2Video) 视频生成工作台建设
**宏观状态:** 主控台学习计划已竣工，K2V 后端服务已就绪。前端沉浸式蓝图与鉴权契约已固化。
**极其详细的下一步开发计划 (Next Actionable Steps):**
- Step 1: 基础设施配置。修改 `vite.config.ts` 增加 `/api/k2v` 反向代理（指向 8081 避开冲突）；在 `src/api/k2v/index.ts` 中封装带有 `X-API-Key` 鉴权的 SSE 客户端与通用 fetch。
- Step 2: 沉浸式视界构建。搭建 `src/views/tools/K2V/index.tsx`，实现 100vw 布局、顶部标题区、瀑布流视频矩阵和底部的纯白 AIGC 生成控制台（包含难度药丸组件与 CTA 按钮）。
- Step 3: 状态闭环。实现 `generate-video` SSE 联调，接入微光加载遮罩，并在收到 `result` 后挂载 `<video>` 标签播放源文件。
