# Funcionalidad: Panel en tiempo real (SSE + invalidación de React Query)

## Objetivo
Que todo panel abierto refleje en ~1 s los cambios de otro admin y los registros públicos de clientes. Decisión en `docs/adrs/0028-tiempo-real-sse-invalidacion.md`. Plan aprobado por el usuario el 2026-09-27: publicar desde cada caso de uso, no con un interceptor.

## Contrato
- **Endpoint:** `GET /api/events` (`text/event-stream`), con sesión obligatoria (`SessionGuard` global, sin `@Public()`).
- **Mensajes:**
  - `event: invalidate` + `data: {"topic":"clients"|"tickets"|"sales"|"inventory"|"staff","reason"?:"client_registered"}`;
  - `event: ping` + `data: {}` cada 25 s.
- **Backend:** puerto `RealtimePublisher.publish(topic, reason?)` en `backend/src/shared/realtime/`. Se publica **después** de guardar con éxito. Publicar nunca lanza errores hacia el caso de uso.
- **Frontend:** mapeo topic → clave raíz de React Query.

| Topic | Lo publica | El frontend invalida |
|---|---|---|
| `clients` | community: RegisterClient (reason `client_registered`), UpdateClient, RegisterVisit, ClaimReward | `clientsKeys.all` |
| `tickets` | ticket.use-cases: createTicket, updateStatus, updateDetails, updatePieces, agregar nota; CRUD de técnicos | `ticketQueryKeys.all` |
| `sales` | CobroService.create/anular, SalesService.createSale, filas del cierre de caja (upsert/delete) | `cashClosingsKeys.all` |
| `inventory` | productos (create/update/archive/restore/adjust), marcas, categorías, celulares | `inventoryKeys.all` |
| `staff` | casos de uso de personal | `['admin','staff']` |

**Efectos cruzados:**
- aprobar/cancelar/volver a pendiente un ticket → `tickets` + `inventory`;
- entregar con cobro → `tickets` + `sales`;
- venta → `sales` + `inventory`;
- visita generada desde un ticket → `clients`.

## Tareas
- [x] T0 (orquestador) commit de respaldo `3dee709` antes de empezar.
- [x] T1 (orquestador) ADR 0028 + este documento.
- [x] T2 (delegada, `backend/src/**`) módulo realtime, endpoint SSE, publicación en casos de uso, tests.
- [x] T3 (delegada, `frontend/src/admin/**`, `frontend/nginx/**`, `frontend/vite.config.js`) `useRealtimeSync`, montaje en AdminLayout, aviso, nginx, proxy de Vite.
- [ ] T4 (orquestador) revisión + prueba con dos pestañas en Chrome + commit final.

## Verificación
- Backend: `pnpm build`, `pnpm exec eslint "{src,test}/**/*.ts"`, `pnpm test`.
- Frontend: `pnpm lint`, `pnpm exec vite build`.
- Manual: dos pestañas, registro público, ticket, venta, reconexión.
- TDD: off (tests unitarios nuevos del bus y del controller, junto con el código).

## Progreso
- 2026-09-27: T0 y T1 hechas.
- 2026-09-27: T3 hecha (frontend). Archivos:
  - `frontend/src/admin/shared/realtime/realtimeTopics.js` (nuevo): mapa topic → clave raíz de React Query, separado del hook para no acoplar features entre sí.
  - `frontend/src/admin/shared/realtime/useRealtimeSync.js` (nuevo): abre `EventSource('/api/events')` solo si `useAuth().isAuthenticated`; escucha `invalidate` (invalida la clave del topic y muestra el toast de `client_registered`), ignora `ping`, y ante `open` después de un `error` invalida todas las claves mapeadas una sola vez (catch-up de reconexión, sin toast). Guard de `typeof EventSource === 'undefined'` (no-op). Cierra el `EventSource` en cleanup (desmonte o logout).
  - `frontend/src/admin/shared/layout/AdminLayout.jsx`: monta `useRealtimeSync()` una vez; como `AdminLayout` solo se renderiza detrás de `RequireAuth`, se desmonta (y cierra la conexión) en cuanto `RequireAuth` redirige a `/admin/login`.
  - `frontend/nginx/default.conf.template`: bloque `location = /api/events` nuevo, antes del bloque regex existente, mismo upstream y headers, más `proxy_http_version 1.1; proxy_set_header Connection ''; proxy_buffering off; proxy_cache off; proxy_read_timeout 1h; proxy_send_timeout 1h; chunked_transfer_encoding on;` (ADR 0028: sin esto el SSE llega con retraso o se corta).
  - `frontend/vite.config.js`: se agregó `events` a la lista de prefijos del proxy de desarrollo.
  - `frontend/vercel.ts`: sin cambios (Vercel serverless no mantiene conexiones abiertas; tiempo real no soportado ahí, ADR 0028).
  - Sin desviaciones del contrato. Sin `pnpm add` (se usó `EventSource` nativo).
- 2026-09-27: T2 hecha (backend). Archivos nuevos:
  - `backend/src/shared/realtime/realtime-publisher.ts`: puerto `RealtimePublisher` (`RealtimeTopic`, `RealtimeReason`).
  - `backend/src/shared/realtime/realtime-bus.ts`: `RealtimeBus` (implementación en memoria con `Subject` de rxjs); `publish` envuelto en try/catch y registra con `Logger` en vez de lanzar.
  - `backend/src/shared/realtime/events.controller.ts`: `@Controller('events')` con `@Sse()` en `GET /api/events` (prefijo global `api` en `main.ts`/`create-nest-app.ts`); `merge` de los eventos del bus (`invalidate`) y un `interval(25000)` (`ping`). Protegido por el `SessionGuard` global (sin `@Public()`).
  - `backend/src/shared/realtime/realtime.module.ts`: `@Global()`, provee `RealtimeBus` y `{ provide: RealtimePublisher, useExisting: RealtimeBus }`, registra `EventsController`.
  - `backend/src/shared/realtime/__tests__/realtime-bus.spec.ts` y `__tests__/events.controller.spec.ts`.
  - `backend/src/app.module.ts`: importa `RealtimeModule`.
  - Mapa publicación → topics (constructor inyecta `RealtimePublisher` opcional con `@Optional()`, `publish` siempre después de un guardado exitoso):
    - `community/application/register-client.use-case.ts` → `RegisterClientUseCase.execute` → `'clients'` con `reason: 'client_registered'`.
    - `community/application/update-client.use-case.ts` → `UpdateClientUseCase.execute` → `'clients'`.
    - `community/application/register-visit.use-case.ts` → `RegisterVisitUseCase.execute` → `'clients'`.
    - `community/application/claim-reward.use-case.ts` → `ClaimRewardUseCase.execute` → `'clients'`.
    - `tickets/application/ticket.use-cases.ts` → `TicketUseCases.createTicket` → `'tickets'`; `updateDetails` → `'tickets'`; `addInternalNote` → `'tickets'`; `updatePieces` → `'tickets'` o `['tickets','inventory']` si el ticket ya está en estado con stock activo (aprobado/trabajando/listo); `updateStatus` → siempre `['tickets','inventory','sales']` (simplificación del contrato: una transición puede tocar stock y/o registrar un cobro según el caso, así que no se re-deriva cuál aplicó).
    - `tickets/application/technician.service.ts` → `TechnicianService.create` y `.update` → `'tickets'`.
    - `tickets/application/cobro.service.ts` → `CobroService.create` → `'sales'`; `.anular` → `'sales'`, o `['sales','inventory']` cuando restaura stock (venta anulada con items).
    - `tickets/application/sales.service.ts` → `SalesService.createSale` → `['sales','inventory']` (además del `'sales'` que ya dispara `CobroService.create` internamente; redundante pero inofensivo, cada caso de uso publica el suyo).
    - `cash-closings/application/upsert-row.use-case.ts` y `delete-row.use-case.ts` → `'sales'`.
    - `inventory/application/product/{create,update,archive,restore,adjust-product-stock}.use-case.ts` → `'inventory'`.
    - `inventory/application/{brand,category,phone}/{create,update,delete}-*.use-case.ts` → `'inventory'`.
    - `staff/application/staff.use-cases.ts` → `CreateStaffUseCase`, `ToggleStaffStatusUseCase`, `ResetStaffPasswordUseCase` → `'staff'` (`ListStaffUseCase` es de solo lectura, no publica).
  - Tests: `RealtimePublisher` opcional (`@Optional()`) en todos los casos de uso — ningún test existente se rompió (no reciben el publisher y el `?.` es un no-op). Se agregó `FakeRealtimePublisher` en `community/application/__tests__/fakes.ts` y se usa en `register-client.use-case.spec.ts` para afirmar `publish('clients', 'client_registered')` tras un registro exitoso y ausencia de publish cuando el teléfono es inválido. Se agregó un `FakeRealtimePublisher` local en `tickets/application/__tests__/sales.service.spec.ts` para afirmar `publish(['sales','inventory'])` tras una venta exitosa y ausencia de publish cuando falla por stock insuficiente.
  - Desviación menor: en el test de `RealtimeBus` ("nunca lanza"), se simula la falla parcheando `subject.next` directamente en vez de hacer que un suscriptor arroje dentro de `.subscribe(fn)` — rxjs envuelve ese callback en un `SafeSubscriber` que aísla y reporta el error de forma asíncrona (fuera del try/catch de `publish`), lo que provocaba un crash de proceso no relacionado con el código propio.
  - Sin cambios de comportamiento de negocio; sin `pnpm add` (rxjs y `@nestjs/common` ya estaban disponibles).
