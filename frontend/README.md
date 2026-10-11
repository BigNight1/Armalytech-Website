# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Admin panel backend rewrites (`vercel.ts`)

`vercel.ts` (compiled with `@vercel/config`) builds the admin-panel rewrites
(`/api/health`, `/api/auth/*`, `/api/inventory/*`, `/api/cash-closings/*`,
`/api/community/*`, `/api/staff/*`, `/api/account/*`, `/api/tickets/*`) from
the `BACKEND_URL` environment variable at build/deploy time. Set `BACKEND_URL`
to the deployed backend origin (e.g. a Render/Railway/Vercel URL for
`backend/`, no trailing slash) in the Vercel frontend project's env vars, and
in local `frontend/.env` for local builds/`vercel dev`. The build fails
loudly if `BACKEND_URL` is missing. The existing `/api/contact` serverless
function and the SPA fallback rewrite (everything not under `/api/`, which is
how `/admin/*` client-side routes still resolve to `index.html`) are
unaffected.
