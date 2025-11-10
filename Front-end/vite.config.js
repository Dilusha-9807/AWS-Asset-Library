import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/edb-os-backup': {
        target: 'http://localhost:5153',
        changeOrigin: true,
      },
    },
  },
})
