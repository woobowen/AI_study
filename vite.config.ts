import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { API_PREFIX } from './src/config/api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    /**
     * 反向代理配置
     * 将前端以 /api/goagents 开头的请求转发至后端根路径（8080 端口），
     * 并在转发时去掉该前缀，实现开发环境跨域隔离。
     */
    proxy: {
      [API_PREFIX.GOAGENTS]: {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX.GOAGENTS}`), ''),
      },
      '/api/k2v': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        timeout: 3600000,
        proxyTimeout: 3600000,
        rewrite: (path) => path.replace(/^\/api\/k2v/, ''),
      },
    },
  },
})
