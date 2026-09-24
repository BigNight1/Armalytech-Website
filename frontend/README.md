# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Admin panel backend rewrites (`vercel.json`)

Vercel's `rewrites` config is plain JSON and can't hold `${BACKEND_URL}`-style
env var interpolation or comments, so the admin-panel prefixes
(`/api/health`, `/api/auth/*`, `/api/inventory/*`, `/api/cash-closings/*`) are
rewritten to a literal placeholder host: `https://REPLACE_WITH_BACKEND_URL`.
Before deploying, replace that placeholder in `vercel.json` with the actual
deployed backend origin (e.g. a Render/Railway/Vercel URL for `backend/`).
The existing `/api/contact` serverless function and the SPA fallback rewrite
(everything not under `/api/`, which is how `/admin/*` client-side routes
still resolve to `index.html`) are unaffected.
