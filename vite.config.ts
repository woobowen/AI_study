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
      '/api/3d-sandbox': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/3d-sandbox/, ''), // 剥离前缀，穿透至后端原生路由
      },
      '/assets/three.min.js': { target: 'http://localhost:8083', changeOrigin: true },
      '/assets/OrbitControls.js': { target: 'http://localhost:8083', changeOrigin: true },
      '/assets/CSS2DRenderer.js': { target: 'http://localhost:8083', changeOrigin: true },
      '/assets/tween.umd.js': { target: 'http://localhost:8083', changeOrigin: true },
      // Rust 后端 (3000 端口) 的全局 v1 路由穿透
      '/api/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
