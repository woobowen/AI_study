import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    /**
     * 反向代理配置
     * 将前端以 /api/llm 开头的请求转发至后端 Go 服务（8080 端口），
     * 并在转发时去掉 /api/llm 前缀，实现开发环境跨域隔离。
     */
    proxy: {
      '/api/llm': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/llm/, ''),
      },
    },
  },
})
