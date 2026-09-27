# Feature: Unsaved-changes guard for admin forms

## Objective
Typed data in admin forms is never lost by an accidental click outside the panel.

## Decisions (user, 2026-09-27)
1. Form modals/drawers do NOT close on backdrop click. They close only via ✕, "Cancelar" or Esc.
2. Closing a form with unsaved input asks first: "¿Descartar los cambios?" → "Seguir editando" / "Descartar". Empty/untouched form closes directly.
3. Read-only overlays (cobro detail, movements, comprobante, etc.) keep closing on backdrop click.
4. No draft persistence (rejected: complexity and stale data).

## Contract (shared, `src/admin/shared/ui/`)
- `Modal` gets `dismissible` (default `true`, current behavior) and `isDirty` (default `false`).
  - `dismissible={false}`: backdrop click does nothing.
  - Any close path (✕, Esc, backdrop when dismissible, footer "Cancelar" that calls the same close handler) goes through a guard: if `isDirty` → show confirm; else close.
- A reusable `useUnsavedGuard(isDirty, onClose)` hook + `DiscardChangesDialog` component for custom drawers that do not use `Modal` (NewTicketDrawer, TicketDetailDrawer notes, RegisterSaleDrawer).

## Tasks
- [x] U1 (delegated, single writer) shared guard + apply to every form overlay in `src/admin/**`.
- [x] U2 (orchestrator) browser QA in Chrome (tabs left open).
  Evidence (2026-09-27, localhost, real session): Nuevo producto — backdrop click keeps drawer + typed value; ✕ shows confirm; "Seguir editando" keeps value; Esc shows confirm; "Descartar" closes. Nuevo ticket — backdrop click with phone typed shows confirm, value kept. Orchestrator reviewed `useUnsavedGuard` + `Modal` diff.

## U1 result

Shared, in `frontend/src/admin/shared/ui/`:
- `useUnsavedGuard.js` (new) — `useUnsavedGuard(isDirty, onClose)` -> `{ requestClose, confirmOpen, confirmDiscard, cancelDiscard }`.
- `DiscardChangesDialog.jsx` (new) — the "¿Descartar los cambios?" dialog, `z-[60]`, Esc/backdrop both map to "Seguir editando" (capture-phase Esc listener so an underlying `Modal` doesn't also react).
- `Modal.jsx` — new `dismissible` (default `true`) and `isDirty` (default `false`) props. Modal owns the guard internally (`useUnsavedGuard` + renders `DiscardChangesDialog`); ✕/Esc/backdrop-when-dismissible all route through it automatically. `footer` and `children` may now be a function `(requestClose) => node` (in addition to a plain node, still supported unchanged) so a caller's own "Cancelar" button can call the identical guarded closer.
- `index.js` — exports `useUnsavedGuard` and `DiscardChangesDialog`.

### Overlay classification

| Overlay | File | Type | `isDirty` means |
|---|---|---|---|
| ConfirmDialog | `shared/ui/ConfirmDialog.jsx` | read-only (confirm) | unchanged, no typed input |
| MovementsModal | `inventory/components/MovementsModal.jsx` | read-only | unchanged |
| CobroDetailModal | `cash-closings/components/CobroDetailModal.jsx` | read-only | unchanged |
| AnularCobroDialog | `cash-closings/components/AnularCobroDialog.jsx` | form | motivo textarea non-empty |
| StaffPage — "Crear nuevo personal" | `staff/StaffPage.jsx` | form | email or password non-empty |
| StaffPage — "Resetear contraseña" | `staff/StaffPage.jsx` | form | new password non-empty |
| ProductFormModal | `inventory/components/ProductFormModal.jsx` | form | any field differs from the snapshot taken on open, or unsaved "nueva marca" text |
| ClientDetailModal | `clients/components/ClientDetailModal.jsx` | form (mixed: loyalty/messaging act immediately, only "Datos" is a form) | firstName/lastName/marketingConsent differ from the client record |
| RegisterVisitModal | `clients/components/RegisterVisitModal.jsx` | form (low-stakes) | unsubmitted phone search text (no client found yet) |
| MustChangePasswordModal | `auth/components/MustChangePasswordModal.jsx` | n/a | mandatory, no dismiss path at all (unchanged) |
| RegisterSaleDrawer (custom) | `cash-closings/components/RegisterSaleDrawer.jsx` | form | cart non-empty or search text non-empty |
| NewTicketDrawer (custom) | `tickets/components/NewTicketDrawer.jsx` | form | any client/equipment/price/parts field entered |
| TicketDetailDrawer (custom) | `tickets/components/TicketDetailDrawer.jsx` | mostly read-only + actions | unsent "nueva nota" text; inner action dialogs (aprobar/entregar/cancelar/comprobante) left as plain confirms, no free-text at risk |

All form overlays: `dismissible={false}` (backdrop no-ops), footer/Cancel routes through `requestClose`, and every successful submit still closes directly (bypasses the guard, per decision #2).

### Deviations
- Guard state (`useUnsavedGuard`/`DiscardChangesDialog`) lives per closer function passed to `Modal`'s `onClose`; Modal owns confirm rendering for its own dismiss paths, custom drawers wire the hook themselves (per the original contract).
- `RegisterVisitModal`'s "Cancelar/Cerrar" button lives in `children`, not `footer` — extended `Modal` to accept `children` as a function too (mirrors `footer`), so this one case didn't need a bespoke pattern.

## Checks
`pnpm lint`, `vite build`, browser QA. TDD: off.
- `pnpm lint`: pass (no warnings/errors).
- `pnpm exec vite build`: pass (build succeeded).
- Browser QA: not run by U1 (see U2).
