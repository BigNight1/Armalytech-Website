import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Reuse BACKEND_URL so the dev proxy targets the same backend as the
  // deployed vercel.ts rewrites, defaulting to the local backend (`backend/`,
  // default port 3000) when unset.
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Admin panel backend (NestJS, `backend/`). Keeps the existing
        // `/api/contact` serverless function (see api/) untouched by scoping
        // the proxy to the admin-panel prefixes only. This prefix list
        // duplicates vercel.ts's BACKEND_PREFIXES (kept separate to avoid a
        // shared build-time import between the two configs). `events` is the
        // realtime SSE stream (ADR 0028, `GET /api/events`); Vite's proxy
        // (http-proxy) forwards it as a plain streamed response, so it needs
        // no extra options beyond the target.
        '^/api/(health|auth|inventory|cash-closings|community|staff|account|tickets|technicians|cobros|sales|events)': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
