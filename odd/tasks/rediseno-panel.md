# Feature: Admin panel redesign (Claude Design) + dark mode

## Objective
Implement the Claude Design redesign faithfully in the existing React app, keeping every current feature. Source of visual truth: `design/panel-admin/Rediseño panel administrativo/Panel Admin Rediseño.dc.html` (+ `_ds/modernist-*/styles.css`, `assets/`, `support.js`). Serve it with `python -m http.server 8765` from that folder and open `http://localhost:8765/Panel%20Admin%20Redise%C3%B1o.dc.html`.

## Why
User-approved redesign (2026-09-25): Modernist structure with the ArmalyTech brand colors, grouped sidebar, user menu, light/dark themes, Configuración screen.

## Scope
- Boards: `/admin/login`, `/admin/inventario` (Productos, Catálogo), `/admin/historial`, `/admin/clientes`, `/admin/personal`, `/admin/cuenta` (Perfil, Configuración), `/ticket/:code` (public, light only).
- Responsive: the design only has 1440px desktop boards; mobile/tablet are adapted by us in the same style.
- Dark mode: new feature, palette from the design (`vars(dark)` in the design script).
- Configuración screen: new, built as in the design.
- Public ticket page: UI now; tickets backend does not exist yet. Use ADR 0007 states (pendiente, aprobado, trabajando, listo, entregado, cancelado, abandonado) and ADR 0006 code format `AT-000148`, not the design's `pendiente/trabajando/finalizado` and `AT-2X9K4M`.

## Constraints
- Keep all existing functionality, routes, data layer (TanStack Query hooks), and the public website untouched (Archivo font and tokens scoped to admin + public ticket page).
- Historial uses Glide Data Grid (canvas): match colors, font, borders and row heights through its theme; pixel-identical cells are not possible (accepted by user).
- Git: no commit/push unless the user asks in that message.
- Code in English; UI copy in Spanish as in the design.

## Design tokens (from the design)
Light: accent `#f97316` (ramp 100 `#ffedd5` … 900 `#7c2d12`), bg `#f8fafc`, surface `#eef2f7`, text `#0f172a`, muted `#475569`, divider `rgba(15,23,42,.2)`, sidebar `#0f172a`, side-pop `#1e293b`, danger `#dc2626` / bg `#fef2f2` / ink `#b91c1c`, ink-accent `#c2410c`.
Dark: bg `#0f172a`, surface `#1e293b`, text `#e2e8f0`, muted `#94a3b8`, divider `rgba(226,232,240,.2)`, sidebar `#020617`, side-pop `#0f172a`, danger `#ef4444` / bg `rgba(239,68,68,.14)` / ink `#fca5a5`, ink-accent `#fdba74`.
Type: Archivo 400/600/800, body 15px, h1 42 / h2 32 / h3 25 / h4 20, headings 800, letter-spacing -0.015em. Radius 0. 2px dividers. Spacing 4/8/12/16/24/32. Buttons: labels flush left. Icons: Lucide.

## TDD
Mode: off. Checks: frontend `pnpm lint`, `pnpm build`; orchestrator visual comparison against the design in the browser.

## Orchestration
Phase 1 (one agent) builds the shared foundation; phase 2 agents work in parallel on disjoint feature folders and wait for phase 1; phase 3 (public ticket + visual QA) after phase 2. Orchestrator reviews every hand-off, runs lint/build, and compares screens against the design.

## Tasks
- [x] R1 — Foundation: tokens (CSS vars light/dark scoped to admin), Tailwind mapping, Archivo, ThemeProvider (claro default, persisted, dark class), lucide-react, restyle `shared/ui/*`, AdminLayout/Sidebar (grouped nav, user menu with Perfil/Configuración/Modo oscuro/Cerrar sesión), header (breadcrumb + Lima clock), responsive shell. Route: delegated.
- [x] R2a — Login + Cuenta (Perfil, Configuración). Route: delegated (parallel).
- [x] R2b — Inventario (Productos, Catálogo, modals). Route: delegated (parallel).
- [x] R2c — Historial (grid theme light/dark, summary panel). Route: delegated (parallel).
- [x] R2d — Clientes + Personal (tables, modals). Route: delegated (parallel).
- [x] R3 — Public ticket page `/ticket/:code` (UI, ADR states/code, dev preview fixture). Route: delegated.
- [ ] R4 — Visual QA against the design (desktop + mobile, light + dark) and fixes. Route: inline/delegated.

## Progress / evidence
- R1 done (uncommitted): tokens in `shared/theme/tokens.css` scoped to `.admin-shell` (+ `.admin-shell.dark`), mapped in `tailwind.config.js`; `ThemeProvider`/`useTheme` (claro default, localStorage); Archivo via Google Fonts link; `lucide-react`; shared/ui restyled (Button primary|secondary|ghost|danger|icon flush-left, Tag, Chip, `.admin-table`, Modal, Toast, pickers); Sidebar grouped nav + user menu (Perfil/Configuración → `/admin/cuenta?tab=perfil|config`, Modo oscuro, Cerrar sesión); Header with breadcrumb (`useBreadcrumb`) + Lima clock; drawer below `lg`. Public bundle CSS has no admin tokens. Deviation: `index.html` has `<body class="dark">` for the public site, so admin dark mode uses CSS vars, never Tailwind `dark:`. Orchestrator check: `pnpm lint` clean, `pnpm build` pass.
- R2a/R2b/R2c/R2d launched in parallel (disjoint folders, separate build outDirs, no shared/ edits — change requests come back to the orchestrator).

- R2b done (uncommitted, not browser-checked): Inventario restyled; product form is a 620px right drawer and Movimientos an 820px dialog (local overlays, shared Modal has no size prop); added "Ganancia por unidad / Margen" block; kept phone search + inline creation and brand+model phone form (real data model). Requests for R4: `Modal` size prop, `ConfirmDialog` icon slot. lint clean, build pass.

- R2d done (uncommitted, not browser-checked): Clientes + Personal restyled; table columns per design (Cliente merged); client detail rebuilt with design sections but kept in the centered shared Modal (design: 640px right drawer); "+1 Visita" now one click per row with per-row pending lock (design behavior; was a confirmation modal), feedback via toast; Actividad phones formatted `+51 9XX XXX XXX`; ConsentBadge local span for accent-800. lint clean; its build failed only on the in-progress R2c `rowThemeOverride` import (not its files).
- R4 input: two agents request a `Modal` `size` / right-drawer variant → do it in R4 and migrate the inventory local overlays + client detail to it.

- R2a done (uncommitted): Login split layout (light/dark, 1440 + 375 checked by the agent), MustChangePasswordModal restyled, Cuenta with `?tab=perfil|config`, Configuración = Apariencia theme picker. lint clean, build pass. Deviation caused by the orchestrator's brief: "Cambiar contraseña" placed under Perfil, but the design puts it under Configuración → fix in R4 (design wins). Found: `tokens.css` `.admin-shell h1–h4` sizes beat Tailwind `text-[..]` utilities, agent used `!text-[..]` → R4: lower that specificity with `:where()` and drop the `!` overrides. Local 50px/46px inputs because shared `Input` is fixed at 42px → R4: add a `size` prop to Input.

- R2c done (uncommitted): Historial — Glide theme built from tokens and rebuilt on theme change (light/dark), INGRESOS/GASTOS group bands, synthetic read-only totals row (edits/deletes on it are ignored because `rows[row]` is undefined), external "+ Agregar fila" button + hint, DateNav bar, summary panel per design. Canvas limits: totals row still numbered in the marker gutter, no 2px divider between groups, no header letter-spacing.
- Orchestrator check after all R2: `pnpm lint` clean, `pnpm build` pass.

- R4a done (uncommitted, not browser-checked beyond the login screen): follow-ups from R2a/R2b/R2d evidence, delegated direct (touched `frontend/src/admin/shared/**`, `auth/**`, `account/**`, `inventory/components/{ProductFormModal,MovementsModal}.jsx`, `clients/components/ClientDetailModal.jsx` — did not touch `ticket/**` or `App.jsx`, owned by the parallel R3 agent).
  - `tokens.css`: `.admin-shell h1–h4` wrapped in `:where(.admin-shell)` (specificity drops to a plain element selector, so any `text-[..]` utility wins on its own); removed the `!text-[..]` overrides in `LoginForm.jsx` (32/44px), `AccountPage.jsx` (40px), `ProfileTab.jsx`/`SettingsTab.jsx` (22px) — sizes confirmed unchanged in the browser (login "Ingresar": 32px mobile / 44px `sm:`).
  - `Input`/`Select` gained a `size` prop (`md` 42/15 default, `lg` 46/15, `xl` 50/16); `Input` also gained `endAdornment` (absolute-positioned node, e.g. password show/hide) so `LoginForm.jsx`'s two fields (`size="xl"`) and `AccountField.jsx`'s five (`size="lg"`, migrated into `ProfileTab`/`SettingsTab`) could drop their hand-rolled markup — `AccountField.jsx` deleted (no longer referenced). Browser-checked: login password toggle still shows/hides text.
  - `Modal` gained `size` (`sm|md|lg|xl` = 500/620/640/820px, matching the design's confirm/pf/cl/mov panels; omit `size` to keep the original 512px dialog width — `StaffPage`'s create-personal modal and `RegisterVisitModal` untouched), `variant="drawer"` (right slide-in, accent left border, panel chrome), `bordered` (dialog variant only — the same divided-header/footer "panel" chrome as the drawer, for wide content dialogs), and `header`/`title` split (`header` overrides the plain `<h2>title</h2>`; `header={null}` renders no header row, e.g. `ConfirmDialog`). `ConfirmDialog` gained an `icon` prop defaulting to `lucide-react`'s `TriangleAlert` in a 44×44 tinted box (danger/accent), matching the design's warning icon on every confirm dialog without touching call sites.
  - Migrated to the new `Modal` variants: `ProductFormModal.jsx` → `variant="drawer" size="md"` (620px, was a local `fixed inset-0` overlay); `MovementsModal.jsx` → `bordered size="xl"` (820px, was a local overlay); `ClientDetailModal.jsx` → `variant="drawer" size="lg"` (640px — was the centered default `Modal`, per R2d's own flagged deviation). All three keep their existing focus/Escape/backdrop-click/scroll-inside-panel behavior (now via `Modal`'s shared `useEffect`); `ClientDetailModal`'s header now shows the 56px avatar/kicker/name/phone line like the design's `cl` panel instead of a plain title + separate phone paragraph.
  - Design fidelity: moved "Cambiar contraseña" from `ProfileTab.jsx` (Perfil) to `SettingsTab.jsx` (Configuración), matching the design's own split — Perfil = session data + email change, Configuración = Cambiar contraseña + Apariencia, same 2-column layout pattern as before. API behavior (session invalidation message, validation) unchanged, just relocated.
  - `admin/README.md` updated: new "Headings win over `!text-[..]`", `Input`/`Select` sizes, `Modal` shapes, `ConfirmDialog` icon bullets under "Design tokens".
  - Not done / left for R4 (visual QA): no live browser check against the design beyond the login screen (no backend/DB available in this session to reach the authenticated inventory/clients/account screens) — the four migrated modals and the moved password section should still get an actual side-by-side pass against `Panel Admin Rediseño.dc.html` (light + dark, desktop + mobile) once that's possible.
  - `pnpm lint`: clean (0 warnings, `--max-warnings 0`). `pnpm exec vite build --outDir <temp> --emptyOutDir`: pass.
- R3 (public ticket) and R4a (shared fixes: `:where()` headings, Input `size`, Modal `size` + drawer variant, ConfirmDialog icon, migrate overlays, move "Cambiar contraseña" to Configuración) launched in parallel (disjoint files).

- R3 done (uncommitted): `frontend/src/ticket/` (TicketPage, presenter, components, DEV-only `?demo=<estado>` fixtures, page-scoped light tokens), lazy route `/ticket/:token` in App.jsx with the real site NavBar/Footer (design board shows the same content). Assumed contract `GET /api/tickets/public/:token` → `{ codigo, estado, cliente{nombre,apellido}, equipo{marca,celular,color?}, titulo, precioTotal, adelanto, fechaIngreso, entregaEstimada?, historialEstados[] }`, 404 not_found. Mapping: tracker Pendiente←pendiente/aprobado, Trabajando←trabajando, Listo←listo/entregado; cancelado/abandonado → closed banner. Omitted the design's "Nota del técnico" because the orchestrator's brief forbade technician notes — OPEN for the user: add a customer-facing note field (separate from internal notes) or leave it out. Agent checked 1440/375 in the browser; lint clean, build pass.

## Next step
Wait for R4a, then R4 visual QA in the browser (desktop + 375px, light + dark) against the design.
