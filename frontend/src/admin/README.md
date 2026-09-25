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
- `src/admin/shared/lib/userDisplay.js` — `getDisplayName(email)`, `getInitials(email)`,
  `getRoleLabel(role)`. The admin API only returns `{ email, role }` for the
  signed-in user (no `name` field), so the sidebar's name/initials are derived
  from the email local-part — documented stand-in, swap it out if a real
  `name` field is ever added to the account.
- `src/admin/shared/ui/index.js` — `Button`, `Input`, `NumberInput`, `Select`,
  `Modal`, `ConfirmDialog`, `EmptyState`, `Spinner`, `Skeleton`/`SkeletonTable`/
  `SkeletonRows`, `DatePicker`, `DateRangePicker`, `Tag`, `Chip`,
  `ToastProvider` + `useToast`. Import from `../shared/ui/index.js`, not by
  re-implementing a button/modal/etc. All restyled for the Claude Design
  redesign (R1) — see "Design tokens" below before styling anything new.
- `src/admin/shared/theme/ThemeProvider.jsx` — `useTheme()` returns
  `{ theme: 'claro' | 'oscuro', isDark, toggleTheme(), setTheme(theme) }`.
  Mounted once in `AdminRoutes.jsx`, above the router — don't add another one.
- `src/admin/shared/layout/breadcrumb.jsx` — `useBreadcrumb(label | null)`,
  callable from any feature page (see "Breadcrumb" below).
- `src/admin/auth/useAuth.js` — `{ admin, isAuthenticated, isLoading, login, logout }`.
- `src/admin/shared/layout/AdminLayout.jsx` — sidebar + header + `<Outlet/>`,
  already wired into routing; feature pages just render their content.

## Routing

Registered in `src/admin/AdminRoutes.jsx`:
`/admin/login` (public) and `/admin` (protected, `AdminLayout`) with children
`inventario` (index redirect target), `historial`, `clientes`, `personal`
(owner-only nav entry, route itself isn't gated here) and `cuenta`. Add nested
routes there if a feature needs sub-pages, but keep the top-level structure.

`cuenta` reads an optional `?tab=perfil|config` query param (Sidebar's user
menu links to `/admin/cuenta?tab=perfil` and `?tab=config`) — R2a (Login +
Cuenta) owns making `AccountPage` read it and render the right tab; it
currently ignores the param.

## Design tokens (Claude Design redesign, R1)

Source of truth: `design/panel-admin/Rediseño panel administrativo/Panel Admin
Rediseño.dc.html` (+ `_ds/modernist-*/styles.css`). Full contract:

- **`.admin-shell` scope.** Every admin token lives under `.admin-shell`
  (`src/admin/shared/theme/tokens.css`), rendered once by `<ThemeProvider>`
  around the whole `/admin/*` tree (`AdminRoutes.jsx`) — including the login
  screen. Never add tokens to `body`/`:root`; the public site must render
  unchanged. Do **not** use Tailwind's `dark:` variant anywhere in the admin
  tree — `index.html`'s `<body class="dark">` makes it permanently "on" for
  the whole app (a pre-existing public-site pattern), so it can't drive the
  admin theme. Light/dark instead comes from plain CSS variables keyed off
  `.admin-shell.dark` (toggled by `useTheme()`), which `tailwind.config.js`
  maps to semantic color names.
- **Use semantic Tailwind classes, not raw hex/slate.** `bg-bg`, `bg-surface`,
  `text-ink`, `text-muted`, `border-line`, `bg-row-hover` for
  light/dark-aware surfaces; `bg-accent` / `text-accent-{100..900}` /
  `text-accent-ink` for the orange ramp + accent-tinted text; `text-on-accent`
  (fixed `#0f172a`, not theme-aware) for text on a solid accent fill;
  `bg-danger` / `bg-danger-bg` / `text-danger-ink` for errors/destructive
  actions. The sidebar is always the dark-navy surface regardless of admin
  theme — use `bg-side-bg`, `bg-side-pop`, `text-side-ink`, `text-side-muted`,
  `bg-side-hover`, `bg-side-active`/`text-side-active-ink`, `border-side-divider`
  there, never the theme-aware tokens. `shadow-admin-lg` for dialog/popover
  elevation. `brand.*` (orange/navy/ink) still works for anything not yet
  migrated, but prefer the tokens above in admin code from now on.
- **Font.** Archivo 400/600/800, loaded via a Google Fonts `<link>` in
  `index.html` (same async pattern as the site's other fonts) and applied
  only inside `.admin-shell`. `font-archivo` Tailwind utility if you need it
  explicitly; headings (`h1`–`h4`) already get Archivo 800 / -0.015em / the
  design's scale for free inside `.admin-shell`.
- **0 radius, flush-left button labels.** Don't add `rounded-*` to admin
  components. `Button` variants: `primary` (accent fill), `secondary`
  (outline), `ghost` (accent text), `danger`, `icon` (36×36 square, e.g.
  table-row actions) — labels are flush-left (`justify-start`), not centered.
- **Headings win over `!text-[..]`.** `.admin-shell h1`–`h4` in `tokens.css`
  are wrapped in `:where(.admin-shell)`, so the rule's own specificity stays
  at a plain element selector — any Tailwind size utility (`text-[22px]`,
  ...) on the heading wins on its own, no `!text-[..]` override needed.
- **`Input` / `NumberInput` / `Select` sizes.** All three take a `size` prop:
  `md` (42px/15px, default — dense tables/inline filters), `lg` (46px/15px —
  drawers, dialogs, account forms), `xl` (50px/16px — the login screen).
  `Input` also takes `endAdornment` (a node absolutely-positioned over the
  input's right edge, e.g. a password show/hide button) — pass matching
  `pr-*` spacing via `className` so typed text doesn't run under it.
- **`Modal` shapes.** `variant="dialog"` (default, centered) or
  `variant="drawer"` (right-side, full-height, accent left border — product
  form, client detail). `size` (`sm|md|lg|xl` = 500/620/640/820px) picks a
  design-matched fixed width; omit it on a dialog to keep the original
  512px width (`StaffPage`'s create-personal modal, `RegisterVisitModal`).
  `bordered` (dialog only) switches to the design's divided "panel" chrome
  (bordered header/footer, scrollable body, 40×40 close button) for wide
  content dialogs (`MovementsModal`); drawers always use that chrome.
  `header` renders custom content (kicker + title, avatar, ...) in place of
  the plain `title` heading — `title` still sets `aria-label` either way,
  and `header={null}` renders no header row at all (`ConfirmDialog`).
- **`ConfirmDialog` icon.** Optional `icon` prop (default: a `lucide-react`
  `TriangleAlert`, matching the design's confirm dialogs) rendered in a
  44×44 tinted box left of the title/message; pass `icon={null}` to omit it.
- **Tables.** `<table className="admin-table">` (defined in `tokens.css`)
  gives header row / row dividers / hover for free — wrap it in a container
  with `border-t-2 border-ink` to match the design's stronger top rule.
- **`Tag`** (`shared/ui/Tag.jsx`) — static badge, variants `neutral | accent |
  solid | danger` (role tags, stock/consent badges). **`Chip`**
  (`shared/ui/Chip.jsx`) — clickable filter pill, `active` boolean (category/
  status filter rows).
- **JS-side tokens.** `shared/theme/tokens.js` exports `themeTokens.{claro,oscuro}`
  (plain hex/rgba values) and `getThemeTokens(theme)`, for code that can't
  read CSS variables at draw time — e.g. the Historial Glide Data Grid theme
  (R2c) or any canvas/SVG rendering. Keep it in sync with `tokens.css` by hand.

## Theme

`useTheme()` (`shared/theme/ThemeProvider.jsx`): `{ theme, isDark,
toggleTheme(), setTheme('claro' | 'oscuro') }`. Defaults to `'claro'`,
persisted to `localStorage` (try/catch — never throws if storage is
unavailable). The header's theme button and the sidebar's "Modo oscuro" menu
row both call `toggleTheme()`; no other theme toggle should exist.

## Breadcrumb

The header renders "Panel / `<Section>`" automatically from the route (see
`SECTION_LABELS` in `shared/layout/Header.jsx`). For a sub-section (a tab, a
detail view), call `useBreadcrumb('Catálogo')` from `shared/layout/breadcrumb.jsx`
in the feature page — it renders "Panel / Inventario / Catálogo" and clears
itself on unmount:

```jsx
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
// ...
useBreadcrumb(activeTab === 'catalogo' ? 'Catálogo' : null);
```

## Responsive

Sidebar is fixed (264px) at `lg` (1024px) and up; below it, it's an
off-canvas drawer opened by the header's menu button (`AdminLayout.jsx`
owns the open/close state). Don't reintroduce the old `md:` breakpoint for
sidebar behavior. Content padding shrinks below `lg`/`sm`; wrap any table
that might overflow at 375px in its own horizontally-scrollable container
(the page itself must not scroll horizontally).

## Brand tokens (Tailwind, legacy)

`brand.orange` (DEFAULT `#f97316`, shades `50–700`), `brand.navy`
(DEFAULT `#0f172a`, `light`/`dark` `#1e293b`/`#020617`), `brand.ink` (`#e2e8f0`).
Still valid (kept working on purpose), but prefer the admin design tokens
above (`bg-accent`, `bg-side-bg`, ...) in admin code going forward.
