# Feature: Admin panel — Inventario + Historial

## Objective
Bring the desktop app `Invetario-Armalytech` (Electron + SQLite) to the web: a NestJS + MongoDB backend and an admin panel in `frontend/` with a left sidebar holding two sections — **Inventario** (brands → models → parts) and **Historial** (spreadsheet-like daily cash closing: `cierre_dia`). The panel header shows live Peru time (America/Lima). Styling follows the brand colors (orange `#f97316`, navy `#0f172a`/`#020617`).

## Why
The desktop app lives on a single PC; the business needs it on the web alongside the public site (PRD / TECH-DESIGN, ADR 0002, 0003, 0011).

## Scope
- Phase 0: NestJS backend scaffold in `backend/`, Mongoose, config, `/api/health`.
- Phase 1: Auth (ADR 0004) + panel layout (sidebar, Lima clock, brand tokens).
- Phase 3 (pulled forward): Inventory module + UI.
- New: Historial (cash closing) module + spreadsheet UI.
- SQLite → Mongo migration script (ADR 0008).

Added 2026-09-23 (user): Clientes section (Phase 4 community: ADR 0012-0018, without messaging).
Out of scope now: Tickets (Phase 2), messaging n8n/Meta (Phase 5).

## Constraints
- Vercel free tier (ADR 0002), MongoDB Atlas M0 (ADR 0003). Atlas URI not provided yet → local/in-memory Mongo for dev and tests.
- Same-origin cookie auth: the frontend proxies (Vite dev) / rewrites (Vercel) the backend `/api/*` prefixes.
- Artifacts in English; UI copy in Spanish (existing site is Spanish).

## Decisions
- "Historial" in the panel = daily cash closing from the desktop app (user, 2026-09-23). The ADR 0018 community history is renamed later and moves under Clientes. Recorded in ADR 0019.
- Stock adjustments use a conditional atomic update (`$inc` with a `quantity >= needed` filter) → 409 when there is not enough stock. Resolves the ADR 0006 pending item.
- Deleting a brand/model cascades to its children, same as the SQLite FKs in the desktop app.

## Architecture (user requirement, 2026-09-23)
Clean Architecture, screaming structure per feature. Backend: `src/<feature>/{domain,application,infrastructure}`.
- `domain`: entities/value objects plus repository ports (interfaces). No Nest, Mongoose, or framework imports.
- `application`: use cases (one class per use case), depending only on domain ports. Domain errors, no HTTP exceptions.
- `infrastructure`: Mongoose schemas plus repository adapters, Nest controllers/DTOs (HTTP adapter), module wiring via DI tokens. A filter maps domain errors to HTTP.
- Dependency rule: infrastructure → application → domain, never the reverse.
Frontend: `src/admin/<feature>/` with container/presentational split and an api/service layer. Components never call `fetch` directly.
- Frontend shared foundation (T6): `src/admin/shared/api/httpClient.js` (fetch wrapper, `ApiError`, `onUnauthorized`), `src/admin/shared/lib/{time,money}.js`, `src/admin/shared/ui/*` (Button, Input, NumberInput, Select, Modal, ConfirmDialog, EmptyState, Spinner, ToastProvider/useToast), `src/admin/shared/layout/*` (AdminLayout, Sidebar, LimaClock), `src/admin/auth/*` (AuthContext/useAuth, RequireAuth, LoginPage), `src/admin/AdminRoutes.jsx` (routing, lazy-loaded from `App.jsx`). Brand tokens in `tailwind.config.js` under `brand.{orange,navy,ink}`.

## API contract (backend, all under `/api`)
- `GET /health`
- `POST /auth/login {username,password}` → signed httpOnly cookie · `POST /auth/logout` · `GET /auth/me`
- Admin bootstrap from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env when the admin collection is empty.
- Inventory: `GET|POST /inventory/brands`, `PATCH|DELETE /inventory/brands/:id`, `GET|POST /inventory/brands/:brandId/models`, `PATCH|DELETE /inventory/models/:id`, `GET|POST /inventory/models/:modelId/parts`, `PATCH|DELETE /inventory/parts/:id`, `POST /inventory/parts/:id/adjust {delta}`, `GET /inventory/search?q=`
- Cash closings: `GET /cash-closings?from&to` (YYYY-MM-DD), `PUT /cash-closings/:date/rows/:rowIndex` (upsert), `DELETE /cash-closings/:date/rows/:rowIndex`, `GET /cash-closings/summary?from&to&groupBy=day|week|month`
- Row shape: `{ id, date, rowIndex, cashIncome, yapeIncome, incomeDetail, cashExpense, yapeExpense, expenseDetail }`

## TDD
Mode: off (no project/session config, no explicit user choice). Ordinary functional checks apply.
Runner: backend `jest` (Nest default, e2e with mongodb-memory-server); frontend `pnpm build` + `pnpm lint`.

## Delivery
Strategy: ask-on-risk (default). Forecast is well above 400 authored lines → chained work-unit commits on `cambiosNuevos`; ask about PR slicing before opening any PR.

## Tasks
- [x] T0 — Repo hygiene: untrack `backend/.env`, root `.gitignore`. Route: inline. Commit `d0e9c50`.
- [x] T1 — Backend scaffold: NestJS, config, Mongoose, `/api/health`, Vercel serverless entry, test setup. Route: delegated (writer, 2+ files). Commit `24b72ba`.
- [x] T2 — Auth module: admin bootstrap, login/logout/me, signed cookie, global guard. Route: delegated. Commit `116911d`.
- [x] T3 — Inventory module per contract + e2e tests. Route: delegated. Commit `44175c6`.
- [x] T4 — Cash-closings module per contract + summary + e2e tests. Route: delegated. Commit `08c22d4`.
- [x] T5 — SQLite → Mongo migration script (idempotent, `--dry-run` counts). Route: delegated. Commit `9e8d359`.
- [x] T6 — Frontend panel shell: brand tokens, `/admin/login`, protected layout, left sidebar (Inventario, Historial), Lima clock header, API client, dev proxy + Vercel rewrites. Route: delegated. Commit `9dedd7a`.
- [x] T7 — Frontend Inventario section (port of the desktop screens). Route: delegated (parallel worktree). Commit `a1f287a`, merged `5ab6c40`.
- [x] T8 — Frontend Historial spreadsheet grid + summary (port of CierreDeDia*). Route: delegated (parallel worktree). Commit `40179d4`, merged `8ff30ea`.
- [x] T9 — Docs: ADR 0019/0020, ADR 0006/0008 resolved, TECH-DESIGN, ESLint config repaired. Route: delegated (parallel worktree). Commits `05f56a2`, `f46f220`, `0ce111a`, merged `bb550dd`.
- [x] T10 — Layout fix: sidebar gap, clock moved left, greeting removed, Clientes route placeholder. Route: inline. Commit `d0c9145`.
- [ ] T11 — Backend community feature (clients, E.164 Peru normalization, phone dedup, consent, visits, community history events). Route: delegated.
- [ ] T12 — Public `/registrar/usuario` form. Route: delegated.
- [ ] T13 — Panel Clientes section (list/search, visits, consent, per-client history). Route: delegated.

## Acceptance criteria
- Backend e2e tests pass; frontend builds and lints.
- Logged-out users hitting `/admin/*` land on `/admin/login`.
- Inventory CRUD works and adjusting below zero returns 409.
- The Historial grid edits cells inline, saves per row, and shows day/week/month totals.
- The header clock shows America/Lima time and updates every second.

## Progress / evidence
- T0: `d0e9c50`. Note: `backend/.env` is still in the history of the unpushed commit `f895096` — do not push it as is (see the closing report).
- T1: `24b72ba` — NestJS scaffold, Clean Architecture layout (`shared/{domain,infrastructure,config}`), `/api/health`, Vercel serverless entry (`api/index.ts` + `vercel.json`), jest unit + e2e (mongodb-memory-server) config.
- T2: `116911d` — Auth feature (domain/application/infrastructure), admin bootstrap on `onApplicationBootstrap`, signed httpOnly session cookie, global guard + `@Public()`, login throttling.
- T3: `44175c6` — Inventory feature (brands/models/parts), cascade deletes, case-insensitive unique brand name (409), atomic conditional stock adjustment (409 on insufficient stock), cross-collection search.
- T4: `08c22d4` — Cash-closings feature, `BusinessDate` value object, upsert-by-(date, rowIndex) via PUT, day/week/month summary with totals + net.
- T5: `9e8d359` — `scripts/migrate-sqlite.ts`, idempotent by natural key, `--dry-run`/`--help`, reuses the inventory/cash-closings Mongoose schemas.
- Verification (`backend/`): `pnpm install` ok (native builds for bcrypt/better-sqlite3/mongodb-memory-server approved via `pnpm approve-builds --all`, tracked in `pnpm-workspace.yaml`); `pnpm build` ok; `pnpm test` — 37/37 unit tests pass; `pnpm test:e2e` — 9/9 e2e tests pass (health, auth login/logout/me + guard, inventory CRUD/cascade/409, cash-closings upsert/list/summary); `pnpm lint` clean; `migrate-sqlite.ts --help`/`--dry-run` verified against a synthetic SQLite fixture.
- Deviation: the migration script talks to Mongo directly via `mongoose.connect` + the same schema classes (not through the running Nest app or a real backend HTTP call), since it's a one-off CLI tool — matches "reuse the domain/infrastructure where sensible" without needing a live server.
- T6: `9dedd7a` — brand tokens (`tailwind.config.js`: `brand.orange/navy/ink`); `src/admin/shared/api/httpClient.js` (`credentials: 'include'`, JSON envelope unwrap, `ApiError`, `onUnauthorized`); `src/admin/shared/lib/{time,money}.js`; `src/admin/shared/ui/*` presentational kit + `ToastProvider`/`useToast`; `src/admin/shared/layout/{AdminLayout,Sidebar,LimaClock}.jsx` (collapsible mobile sidebar, live Lima clock); `src/admin/auth/*` (`AuthContext`/`useAuth`, `RequireAuth` guard, `LoginPage`/`LoginForm`); placeholder `src/admin/{inventory/InventoryPage,cash-closings/CashClosingsPage}.jsx`; `src/admin/AdminRoutes.jsx` registering `/admin/login` and the protected `/admin` layout (children `inventario`/`historial`, index redirects to `inventario`), lazy-loaded from `App.jsx` (own bundle chunk, confirmed via `pnpm build`); `App.jsx` hides the public WhatsApp widget on `/admin/*`; `vite.config.js` dev proxy scoped to `^/api/(health|auth|inventory|cash-closings)` → `localhost:3000` (existing `/api/contact` untouched); `frontend/vercel.json` rewrites for the same prefixes to a `REPLACE_WITH_BACKEND_URL` placeholder host (documented in `frontend/README.md`, since JSON can't hold comments/env interpolation); `frontend/src/admin/README.md` with conventions for the T7/T8 feature agents.
- Verification (`frontend/`): `pnpm install` ok; `pnpm build` ok (admin bundle splits into its own lazy chunk, ~9.7 kB gzip 3.6 kB, separate from the public bundle); `pnpm lint` — pre-existing failure on the base commit (`eslint.config.js` uses `pluginReact.configs.flat.recommended`, which is `undefined` for the installed `eslint-plugin-react@7.34.1` + `eslint@8.57.0` combo — reproduced identically via `git stash` before any of my changes), unrelated to T6; no lint tool could run to check my files against project rules because of this pre-existing breakage.
- Backend not started for this task (not required by the Verification section); not verified end-to-end against a live backend.

- Fix: `06fc7b4` — optional `DNS_SERVERS` override; the local Node resolver (127.0.0.1) refused SRV lookups (`querySrv ECONNREFUSED`). Verified `/api/health` → db connected against Atlas.
- T7: Excel import skipped (needs a backend bulk endpoint). Search results lack brandId (resolved by name).
- T8: deleting a row clears that rowIndex (no shifting). Paste-matrix/undo from the desktop app not ported.
- Integration: `pnpm build` ok after merging T7+T8 (admin chunk 49.7 kB).

## Next step
T7 (Inventario UI) and T8 (Historial spreadsheet UI) can now build on `src/admin/inventory/` and `src/admin/cash-closings/` respectively, importing only from `src/admin/shared/*` and `src/admin/auth/useAuth.js` per `src/admin/README.md`. T9 (docs: ADR 0019, TECH-DESIGN, backend README env vars) still pending. Open issue: the repo-wide ESLint config is broken (see above) — worth a separate fix so `pnpm lint` becomes usable again.
