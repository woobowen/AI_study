/** 各微服务的 API 路径前缀，由反向代理统一分发 */
export const API_PREFIX = {
  GOAGENTS: '/api/goagents',
  USER: '/api/v1/auth',    // 修复：指向真正的 Rust auth 路由
  VAULT: '/api/v1',        // 修复：指向真正的 Rust 金库基础路由
  C2V: '/api/c2v',
  K2V: '/api/k2v',
} as const;
