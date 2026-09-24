import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Admin panel backend (NestJS, `backend/`, default port 3000). Keeps
      // the existing `/api/contact` serverless function (see api/) untouched
      // by scoping the proxy to the admin-panel prefixes only.
      '^/api/(health|auth|inventory|cash-closings|community)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
