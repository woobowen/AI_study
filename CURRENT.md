# 🔄 研发交接快照 (CURRENT.md / HANDOFF)
当前战役状态: **C2V/K2V 沉浸车间复活战役已完美收官，Go/Rust/Python 异构网关穿透与载荷路由映射已全线打通**，四端链路进入稳定运行态。
宏观态势: 主线兵力已全面转向 `/vault`（个人金库）产品化 UI 铸造与错题/收藏数据的真实下发渲染，Onboarding/Auth 维持既有稳定闭环。
执行纪律: 已确认 `Auth -> Onboarding -> Dashboard` 为唯一可信渲染瀑布流，任何新功能接入不得破坏该阻断序。

---

## 战役状态 (Current State)
- **鉴权闭环**：Rust UserProfile 服务 JWT 获取、持久化、请求头注入已打通，登录后可直接驱动受保护资源请求。
- **跨域穿透**：前端通过 Vite Proxy 稳定转发到 `3000` 端口，摆脱直接跨域调用的脆弱路径。
- **渲染秩序**：微拟态登录视图已落地，Auth 与 Onboarding 阻断态采用 Early Return 物理切断，避免同屏叠层污染。
- **金库写入链**：Vault 的 bookmarks/errors 写入链已完成联调，具备可持续扩展的 SDK 与类型壳。

## 战利品 (Done)
- [x] **C2V/K2V 视听车间无损并入主干。Vite Proxy 成功建立 8080(Go)/3000(Rust)/8081(K2V)/8082(C2V) 四向网关分发矩阵。**
  - 已形成统一代理入口与异构后端分发闭环。
  - Go、Rust、K2V、C2V 路由互不冲突并可并行演进。

- [x] **异构载荷映射规则物理固化：GoAgents 严格消费 `profile_text`，Python 引擎精确映射 `profile_summary` 至 `extra_info`，双轨并行互不污染。**
  - Go/Python 请求体组装策略已按引擎类型强制分流。
  - 既有 GoAgents 契约与 C2V/K2V 契约均保持原生一致性。

- [x] **Rust 后端 CORS 穿透与 Vault POST 接口运行时 SQL 绑定完成。**
  - 已稳定写入 `POST /api/v1/vault/bookmarks`。
  - 已稳定写入 `POST /api/v1/vault/errors`。
  - 后端 SQL 查询采用运行时绑定路径，规避编译期环境耦合。

- [x] **前端 Vite Proxy 挂载 3000 端口，Vault SDK 类型化封装完毕。**
  - `vite.config.ts` 代理链路可用于 UserProfile + Vault 双域。
  - SDK 已包含 `addFavorite`、`addMistake` 等核心写操作。
  - 统一请求壳确保调用侧不再处理裸 `Response`。

- [x] **`useAuthStore` 鉴权闭环完成，JWT Token 成功获取并无缝注入 Axios 请求头。**
  - 登录/注册后 Token 双写（内存态 + localStorage）已生效。
  - 拦截器统一注入 `Authorization: Bearer <token>`。
  - 401 场景具备回收与重登基础路径。

- [x] **确立 `Auth -> Onboarding -> Dashboard` 绝对排他渲染管线。**
  - 阻断态切换通过组件顶层 early return 执行。
  - 废弃 `z-index` 覆盖与 `display: none` 伪隔离方案。
  - 渲染秩序已可作为后续页面接入基线。

## 转移火力 (Next Actionable Steps)
- [ ] **目标 1：聚焦 `/vault` 页面开发。**
  - 基于现有 `100vw ImmersiveLayout` 实装“错题本（Errors）+ 多态收藏夹（Bookmarks）”双轨列表界面。
  - 首批必须完成真实下发渲染，并覆盖空态、加载态与错误回退态。
  - 全面对齐微拟态视觉体系与 8pt 网格规范，禁止临时样式破坏一致性。
