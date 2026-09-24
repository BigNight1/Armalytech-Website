# Admin panel — frontend conventions

Shared foundation for the admin panel (`/admin/*`). Read this before adding a
feature folder (`inventory/`, `cash-closings/`, ...).

## Folder layout per feature

```
src/admin/<feature>/
  api/            # one service module per feature, built on shared/api/httpClient
  hooks/          # feature-local hooks (data fetching, derived state)
  components/     # presentational components — props in, JSX out, no fetch
  <Feature>Page.jsx  # container: wires hooks + api + presentational components
```

- **Components never call `fetch`/`httpClient` directly.** Only the feature's
  `api/` module talks to the backend; components and hooks consume it.
- Container/presentational split: a `*Page.jsx` (or `containers/`) component
  owns state and side effects; everything under `components/` is presentational
  and receives data/handlers via props.
- Code, comments, and identifiers in English. UI copy (labels, buttons,
  errors) in Spanish, matching the rest of the site.

## What's already built — import, don't re-create

- `src/admin/shared/api/httpClient.js` — `httpClient.{get,post,patch,put,delete}(path, body?, options?)`,
  `ApiError` (`status`, `code`, `message`), `onUnauthorized(handler)`. Base URL is `/api`,
  `credentials: 'include'` on every call, JSON envelope already unwrapped
  (`{ ok, data }` → resolves to `data`; `{ ok: false, error }` → throws `ApiError`).
- `src/admin/shared/lib/money.js` — `formatPEN(amount)`, `parseMoney(value)`.
- `src/admin/shared/lib/time.js` — `formatLimaDateTime(date?)`, `todayInLima(date?)`
  (use this for the Historial date filters' default value).
- `src/admin/shared/ui/index.js` — `Button`, `Input`, `NumberInput`, `Select`,
  `Modal`, `ConfirmDialog`, `EmptyState`, `Spinner`, `ToastProvider` + `useToast`.
  Import from `../shared/ui/index.js`, not by re-implementing a button/modal/etc.
- `src/admin/auth/useAuth.js` — `{ admin, isAuthenticated, isLoading, login, logout }`.
- `src/admin/shared/layout/AdminLayout.jsx` — sidebar + header + `<Outlet/>`,
  already wired into routing; feature pages just render their content.

## Routing

Registered in `src/admin/AdminRoutes.jsx`:
`/admin/login` (public) and `/admin` (protected, `AdminLayout`) with children
`inventario` (index redirect target) and `historial`. Add nested routes there
if a feature needs sub-pages, but keep the top-level two entries.

## Brand tokens (Tailwind)

`brand.orange` (DEFAULT `#f97316`, shades `50–700`), `brand.navy`
(DEFAULT `#0f172a`, `light`/`dark` `#1e293b`/`#020617`), `brand.ink` (`#e2e8f0`).
Use these instead of raw hex/slate-only classes for anything brand-colored.
