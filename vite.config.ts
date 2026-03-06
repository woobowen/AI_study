import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { API_PREFIX } from './src/config/api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [API_PREFIX.GOAGENTS]: {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX.GOAGENTS}`), ''),
      },
      [API_PREFIX.C2V]: {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        timeout: 3600000,
        proxyTimeout: 3600000,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX.C2V}`), ''),
      },
      [API_PREFIX.K2V]: {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        timeout: 3600000,
        proxyTimeout: 3600000,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX.K2V}`), ''),
      },
      // Rust 后端 (3000 端口) 的全局 v1 路由穿透
      '/api/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})