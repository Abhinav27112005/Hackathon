import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,   // expose to local network (lets mobile access via PC's IP)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // fixed: was https, should be http
        changeOrigin: true,
      }
    }
  }
})
