# Feature: Inventario v2 — product catalog with phone compatibility

## Objective
Replace the `brands → models → parts` inventory with a product catalog that covers both sale accessories (speakers, headphones, chargers, cables) and model-dependent items (screen protectors, charging ports, screens, repair parts): each product has a category, optional brand, stock, cost, sale price, minimum stock and a list of compatible phones. Every stock change is recorded as a stock movement (kardex). One search box finds products by phone model ("A54") or by text ("cargador samsung").

## Why
The current hierarchy cannot represent accessories (not tied to a phone) or an item that fits several phones without duplicating stock. Tickets (next feature) consume these products, so the catalog must exist first. Source of truth: ADR 0006 update (2026-09-25).

## Scope
- Backend: catalog (brands, phones, categories with seed), products, stock adjustments with movements, search. Replaces models/parts.
- Frontend: Inventario section rebuilt on the new API (product list, filters, search, product form, catalog management, movements view).
- Out of scope (next features): Sell button, sales, cobros, tickets.

## Constraints
- Clean Architecture per feature (`backend/src/inventory/{domain,application,infrastructure}`), same conventions as today.
- Current inventory data is test data: no migration. Old models/parts code, schemas and endpoints are removed. `scripts/migrate-sqlite.ts` keeps migrating cash closings only.
- No Mongo transactions: atomic conditional `$inc` per product (ADR 0006).
- All panel users are admins for now and see cost and margin.
- Git: do not commit or push unless the user asks in that message (project rule). Leave changes uncommitted.
- Artifacts in English; UI copy in Spanish.

## Decisions
- Deleting a brand, phone or category that is in use returns 409 (no cascade: it would silently delete products and break movement history).
- Deleting a product archives it (`active=false`); movements keep pointing to it. Archived products are hidden by default.
- Stock only changes through adjust (and later sales/tickets); PATCH never touches stock.
- A product created with initial stock > 0 writes an `ajuste_entrada` movement with reason "Stock inicial".
- Default categories seeded on bootstrap when the collection is empty: Pantallas, Micas, Zócalos, Cables, Cargadores, Parlantes, Audífonos, Repuestos.

## API contract (all under `/api/inventory`, admin-only)
- Brands: `GET /brands`, `POST /brands {name}`, `PATCH /brands/:id {name}`, `DELETE /brands/:id` (409 if used by phones or products). Unique case-insensitive name (409).
- Phones: `GET /phones?brandId`, `POST /phones {brandId, name}`, `PATCH /phones/:id {brandId?, name?}`, `DELETE /phones/:id` (409 if listed in any product's compatibility). Unique name per brand (409).
- Categories: `GET /categories`, `POST /categories {name}`, `PATCH /categories/:id {name}`, `DELETE /categories/:id` (409 if used by products).
- Products:
  - `GET /products?q&categoryId&phoneId&lowStock=true&includeArchived=true&page&limit` → `{ items, total, page, limit, matchedPhones }`. `q`: if it matches phone names (case-insensitive, contains), results include products compatible with those phones, plus products whose name/model/brand match the text; `matchedPhones` lists the phones matched so the UI can say "Compatibles con Samsung A54". `lowStock` = `stock <= minStock`.
  - `GET /products/:id`
  - `POST /products {categoryId, brandId?, name, model?, stock, cost, salePrice, minStock, compatiblePhoneIds[]}`
  - `PATCH /products/:id` (same fields minus `stock`)
  - `DELETE /products/:id` → archive; `POST /products/:id/restore`
  - `POST /products/:id/adjust {delta, reason?}` → 409 when stock would go below 0; writes a movement.
  - `GET /products/:id/movements?page&limit` → most recent first.
- Product shape: `{ id, category: {id, name}, brand: {id, name} | null, name, model, stock, cost, salePrice, minStock, compatiblePhones: [{id, name, brandName}], active, createdAt, updatedAt }`.
- Movement shape: `{ id, productId, type, quantity, stockAfter, reference: {type, id} | null, reason, userId, userEmail, occurredAt }`, `type` ∈ `venta | ticket_salida | ticket_devolucion | ajuste_entrada | ajuste_salida`; `quantity` is signed.

## TDD
Mode: off (no project/session config, no explicit user choice). Ordinary functional checks apply.
Runner: backend `pnpm build`, `pnpm test`, `pnpm test:e2e` (mongodb-memory-server), `pnpm lint`; frontend `pnpm build`, `pnpm lint`.

## Delivery
Strategy: ask-on-risk. No commits unless the user asks (project rule).

## Tasks
- [x] T1 — Backend inventory v2: catalog, products, adjust + movements, search, category seed; remove models/parts; keep migrate-sqlite compiling (cash closings only); unit + e2e tests. Route: delegated (writer, 2+ non-trivial files; preparation reading needed).
- [x] T2 — Frontend Inventario v2: product list with search/category chips/low-stock filter, product form with compatible-phone multi-select and inline brand/phone creation, +/− adjust, archive, movements modal, catalog management (brands, phones, categories). Route: delegated (writer).
- [x] T3 — Browser pass against the live backend. Route: inline.

## Acceptance criteria
- Searching "A54" lists every product compatible with any phone named like "A54", grouped by category in the UI.
- Adjusting below zero returns 409 and the UI shows it; every successful adjust appears in the product's movements.
- Deleting an in-use brand/phone/category returns 409 with a clear message.
- Backend unit + e2e tests pass; frontend builds and lints.

## Progress / evidence
- T1 (uncommitted, delegated writer): `backend/src/inventory/` reworked — brands (409 when in use), phones, categories (+ default seed on bootstrap), products (archive/restore, filters, pagination, phone-aware `q` search with `matchedPhones`), stock movements (adjust + "Stock inicial"), 4 controllers; models/parts/search removed; `scripts/migrate-sqlite.ts` now cash closings only; README updated. Envelope `{ ok, data }` / `{ ok:false, error:{ statusCode, message, code } }`. Missing references → 404. `PATCH /products/:id` cannot clear `brandId` (not in contract).
  - `pnpm build`: pass. `pnpm test`: 106/106 pass (16 suites). `pnpm lint`: inventory clean; 2 pre-existing unused-import errors in `src/auth` (untouched).
  - e2e was blocked for every suite: `@nestjs/jwt@12` ships ESM only and Jest (ts-jest, CJS) cannot load it. Orchestrator pinned `@nestjs/jwt@^11.0.2` (CJS, same `JwtModule`/`JwtService` API, peer Nest 8–11). After the pin `pnpm test:e2e`: inventory, health, cash-closings pass; 3 stale pre-existing failures outside this feature: `auth.e2e` expects username `admin` but login is by email since ADR 0021; `community.e2e` expects `visitCount` 1/2 on register but loyalty changed registration to not count a visit.

- T2 (uncommitted, delegated writer): `frontend/src/admin/inventory/` rebuilt — Productos tab (debounced search, category chips, Stock bajo, Archivados, phone-match grouping by category, table with +/− optimistic adjust, margin, archive/restore), product form modal with phone multi-select + inline brand/phone creation, movements modal, Catálogo tab (brands, phones, categories). Old brands→models→parts UI removed. `GET /phones` has no `brandName`: joined client-side with brands. Grouping by category covers the current page only.
  - Orchestrator fix: hooks called `notify()` in the render body on query errors → toast flood (also pre-existing in 3 Clientes hooks). New `shared/lib/useQueryErrorToast.js` (effect-based) used in 8 hooks; `ToastProvider` skips a message already on screen.
  - `pnpm lint`: clean. `pnpm build`: pass.
- Related (user request, same session, uncommitted): auth hardening + security e2e suite. Hardcoded JWT fallback secret removed; `JWT_SECRET` canonical (>=32 chars), `SESSION_SECRET` deprecated alias with startup warning; dead signed-cookie code removed; stale `auth.e2e` updated. `test/security.e2e-spec.ts` 30/30: NoSQL/SQL-style injection, query operator injection, regex/ReDoS, JWT tampering (other secret, alg none, edited payload, expired, stale tokenVersion), mass assignment, unauthenticated access, cookie flags — all secure as-is. FIXED: `ThrottlerGuard` was never registered, so login had no rate limit; now global, with a 1000/min ceiling so only login (5/min) and public register (10/min) bite. `pnpm test` 106/106; `pnpm test:e2e` 45/47 (2 known stale community visitCount tests).

- T3 (browser, live backend restarted by the user): Catálogo create brand + phone OK; delete in-use brand → 409 toast, brand kept; product create with category/brand/compatible phone/initial stock OK; search "QA A54" → "Compatibles con …" + grouped "MICAS (1)"; text search + category chip OK; −/− → stock 1 with "Stock bajo" badge; movements modal shows Entrada +3 "Stock inicial" and two Salida −1 with user and stock after; archive → hidden, Archivados → Restaurar OK; Clientes/Historial still load. All requests 2xx except the intended 409. Fixed during the pass: unhandled promise rejection on failed catalog mutations (6 try/finally without catch in CatalogPanel/PhonesPanel). React hook-order warnings seen only during HMR of the toast fix; a clean reload showed none. Test data left: brand "QA Marca", phone "QA A54", product "QA Mica 9H" (restored, stock 1) — the product can only be archived, and the brand/phone stay 409 while an archived product references them (by design), so test data cannot be fully removed from the UI. Follow-up: decide whether a product with no movements besides "Stock inicial" may be hard-deleted. Not checked: wide-desktop layout (pane is ~500px wide).

## Next step
Done pending user review/commit. Previously: restart the backend (the running one was started with `pnpm run start`, no watch, so it still serves v1) and do the browser pass. User action: rename SESSION_SECRET → JWT_SECRET locally and in Vercel. Follow-up debt: stale community e2e test; throttler uses req.ip (behind the Vercel rewrite all clients may share an IP — evaluate `trust proxy`), and in-memory throttle storage is per serverless instance.
