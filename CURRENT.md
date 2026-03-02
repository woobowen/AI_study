# 🔄 研发交接快照 (CURRENT.md / HANDOFF)
**当前战役:** K2V (Knowledge2Video) 视频生成工作台建设  
**宏观状态:** K2V 前端全链路（状态注入、微光遮罩、SSE 联调）已完成首次调用点火，但遭遇后端致命拦截：报错提示缺失 `/app/src/api_config.json`。  
**执行纪律:** 已触发“后端零猜测与绝对从属”熔断机制，暂停前端侧继续猜测式修复。

---

## 极其详细的下一步开发计划 (Next Actionable Steps)
- Step 1: 立即暂停前端迭代流。冻结 K2V 页面与 API 封装层的新增改动，避免在后端不可用状态下继续堆叠前端补丁。
- Step 2: 焦点转移至后端 K2V 工程目录进行物理勘探。定位 `/app/src/api_config.json` 缺失根因，核对镜像挂载路径、容器工作目录与配置加载入口。
- Step 3: 查找缺失配置模板。优先在后端仓库中检索 `api_config` 相关样例、默认模板或环境变量映射文档，完成配置注入并重启服务。
- Step 4: 后端恢复后再重启前端联调。重新验证 `/api/k2v/api/v1/generate-video` 的 SSE 事件链（running/result/finished/failed/error）与文件流地址拼接闭环。

