# Feature: Responsive admin panel + public pages

## Objective
Every admin screen and the public pages work at 375 / 768 / 1024 / 1440 px with no page-level
horizontal scroll and no clipped content. Out of scope: ticket states (keep `trabajando` / "En taller").

## Root cause found
The content column in `AdminLayout.jsx` was a flex item without `min-w-0`, so it grew to the widest
table and defeated every `overflow-x-auto` wrapper (the page scrolled sideways and the dark
background ended mid-page, seen on /admin/personal on a phone).

## Conventions (all tasks)
- Drawer/modal padding: `px-4 sm:px-7` (never a fixed `px-7`).
- Button rows / footers: `flex-wrap` + gap; on phone the primary action may go full-width.
- Tables: inside `overflow-x-auto`; long strings use `break-all` or `truncate`.
- Multi-column grids: add a smaller base column count with `sm:` / `md:` variants.

## Tasks
- [x] R0 (orchestrator, inline) `AdminLayout.jsx` min-w-0; `shared/ui/Modal.jsx` responsive padding + wrapping footer; `inventory/components/MovementsModal.jsx` overflow-x-auto; `ticket/components/TicketView.jsx` break-all on URL.
- [x] R1 (delegated, `src/admin/tickets/**`) TicketDetailDrawer + NewTicketDrawer: responsive padding, wrapping footers/header actions, grids with breakpoints, step tabs readable at 375.
  Evidence: agent lint + build pass; orchestrator re-ran `pnpm lint` (exit 0). Review fix: "Cambiar estado" menu was centered under a left-edge button (would overflow left at 375) → left-0 with viewport-capped width.
- [x] R2 (delegated, `src/admin/cash-closings/**`) RegisterSaleDrawer footer/padding, CobroDetailModal overflow-x-auto, Glide grid usable on phone (horizontal scroll inside its own box).
  Evidence: grid renders at max(container, sum of column widths) inside `overflow-x-auto`; header row wraps; drawer/modal padding + wrap. Agent: lint pass, vite build pass. Orchestrator read the grid diff.
- [x] R3 (orchestrator) Browser QA of every route at 375/768/1024/1440 (needs the user logged in on localhost:5173), fix leftovers.
  Method: Claude in Chrome with the user's session; same-origin iframes at exact widths (Chrome window min is 662px).
  Evidence: 9 routes x 4 widths = 36 loads, all authenticated, no page-level horizontal overflow. Overlays at 375 (ticket detail, nuevo ticket, registrar venta, nuevo producto, nuevo personal, detalle cliente): no overflow.
  Fixes found in QA: ticket detail drawer scrolls as a whole on phone (header+footer left ~30px of body); note input `min-w-0` ("Agregar nota" overflowed 6px).
  Reverted R2 grid change: Glide caps its root at `max-width: 100%`, so the wider width had no effect; Glide's own DOM scroller (`dvn-scroller`) already scrolls horizontally (312px visible / 901px content) and supports touch.
  Final: `pnpm lint` exit 0; `vite build` OK.

## Checks
`pnpm lint`, `pnpm exec vite build --outDir <temp> --emptyOutDir`, browser QA with screenshots.
TDD: off (layout-only changes; no test runner for UI).

## Progress
- 2026-09-27: static audit done (Explore agent); R0 applied.
