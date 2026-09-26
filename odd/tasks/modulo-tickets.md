# Feature: Módulo de Tickets de Servicio Técnico e Integración 360°

## Objetivo
Implementar el módulo completo de Tickets en Backend (NestJS + MongoDB) y Frontend (React + Vite, diseño Modernista Claude Design), integrándolo de forma atómica con Clientes (Ficha 360°), Inventario (consumo de repuestos y Kardex) e Historial de Caja (asientos de adelanto y saldo), conforme a ADR 0006, ADR 0007 y ADR 0025.

## Reglas de Orquestación
- **Rol de Antigravity:** Orquestador principal. Supervisa, asigna tareas a subagentes en carpetas disjuntas, verifica contratos de API, revisa hand-offs, previene código duplicado y valida mediante lint/build.
- **Regla Git:** NUNCA ejecutar `git commit` ni `git push` a menos que el usuario lo pida explícitamente en el mensaje actual (aplica a todos los subagentes).
- **Estándar de código:** TypeScript en backend, React/JS en frontend; código en inglés y textos UI en español.
- **Tokens de diseño:** Usar componentes compartidos (`admin/shared/ui/`) con variantes `variant="drawer"` y tokens de Claude Design ya implementados.

## Decisiones (2026-09-25) — ver ADR 0025, sección "Actualización (2026-09-25)"
- Piezas = productos del inventario v2 (`productoId`, `stock`), movimientos `ticket_salida` / `ticket_devolucion`.
- Disponible = stock − planificado en otros tickets pendientes; si 0, pieza bloqueada "Reservada para AT-xxxxxx".
- Precio total acordado escrito por el admin; sin mano de obra; costo solo visible en el panel.
- Cobros en colección aparte (`cobros`, efectivo | yape), filas bloqueadas en el Historial.
- Clave del equipo (ninguno | pin | contraseña | patrón 3×3) cifrada con `TICKET_SECRET_KEY`, se borra al entregar/cancelar.
- Equipo enlazado al catálogo de celulares; campos `titulo`, `notaCliente`, `notasInternas`.
- Entregar suma 1 sello. Sección Técnicos (Martin Armas, Kevin Armas).
- Pantallas del panel se diseñan primero en Claude Design (brief: `design/brief-tickets.md`); implementación después del diseño.
- TDD: off. Checks: backend build/test/test:e2e/eslint sin --fix; frontend lint/build; QA visual del orquestador.

## Desglose de Tareas

### Fase 1: Backend Core (`backend/src/tickets/`)
- [ ] **T1.1 — Schema & Model:** Esquema Mongoose `Ticket` con correlativo atómico `AT-000001`, token criptográfico UUID, clienteId con snapshot, equipo, repuestosUsados, costos, 7 estados de ADR 0007 e historial de eventos.
- [ ] **T1.2 — Service & Controller:** Endpoints CRUD protegidos (`POST /api/tickets`, `GET /api/tickets?q=...&estado=...`, `GET /api/tickets/:id`, `PATCH /api/tickets/:id/status`).
- [ ] **T1.3 — Endpoint Público:** `GET /api/tickets/public/:token` para conectar la vista pública `/ticket/:token`.

### Fase 2: Integraciones Transaccionales (Backend)
- [ ] **T2.1 — Consumo de Inventario:** Hook transaccional en `PATCH /status`:
  - Al pasar a `aprobado`: `$inc: { cantidad: -cant }` atómico en inventario y log en Kardex.
  - Al pasar a `cancelado`: `$inc: { cantidad: +cant }` restituye stock en inventario y log en Kardex.
- [ ] **T2.2 — Ficha 360° Clientes:** Endpoint `GET /api/community/clients/:id/tickets` para obtener el historial completo de reparaciones de un cliente.
- [ ] **T2.3 — Cierre de Caja:** Registrar cobro de adelanto y cobro de saldo en `cash-closings` referenciando el ticket.

### Fase 3: Frontend Admin (`frontend/src/admin/tickets/`)
- [ ] **T3.1 — Bandeja & Navegación:** Vista `/admin/tickets` con filtros por estado, buscador debounced (celular, código, nombre, IMEI), tabla y navegación en Sidebar con badge de tickets activos.
- [ ] **T3.2 — Drawer Nuevo Ticket (640px):** Formulario con búsqueda predictiva de clientes por teléfono (autocompletado o alta rápida), datos de equipo, repuestos asignados con cálculo de costo/margen y adelanto.
- [ ] **T3.3 — Drawer Detalle & Transición de Estados:** Línea de tiempo de estados, notas técnicas, cambio de estado con confirmación.
- [ ] **T3.4 — Comprobante & WhatsApp:** Modal de comprobante de servicio imprimible y botón directo para enviar WhatsApp con mensaje formateado y enlace público de seguimiento.

### Fase 4: Frontend Clientes Ficha 360° (`frontend/src/admin/clients/`)
- [ ] **T4.1 — Pestaña Historial en ClientDetailModal:** Añadir pestaña "Historial de Servicios" con la lista de tickets del cliente.

### Fase 5: Validación & QA del Orquestador
- [ ] **T5.1 — Verificación Frontend:** `pnpm lint` sin warnings, `pnpm build` exitoso.
- [ ] **T5.2 — Verificación Backend:** Build de NestJS sin errores de tipado.
- [ ] **T5.3 — Visual QA:** Comparación de pantallas en modo claro y oscuro.

## Fase de corrección y cierre (2026-09-26)
Origen: revisión read-only (Engram #39). Orquestación con la skill `.claude/skills/orquestador-armalytech`. Todos los agentes: Sonnet, sin commit.

### Contrato (fuente de verdad para C1/C2/C3)
- `POST /api/tickets` body = `CreateTicketDto` actual: `cliente{clienteId?, nombre, apellido?, telefono}`, `equipo{marcaId?, celularId?, marca?, modelo?, color?, imei?, fallaReportada, estadoIngreso?}`, `claveEquipo?{tipo: ninguno|pin|contrasena|patron, valor?}` (valor obligatorio si tipo ≠ ninguno → 400 "Ingresa la clave del equipo"), `titulo`, `notaCliente?`, `notasInternas?`, `tecnicoId?`, `tecnicoNombre?`, `piezas?[{productoId, nombre, categoria?, cantidad, costoUnitario?}]`, `precioTotal`, `adelanto?`, `metodoAdelanto?: efectivo|yape`, `fechaEntregaEstimada?`.
- `GET /api/tickets/availability?categoriaId=&celularId=&excludeTicketId=` → `[{ productoId, nombre, categoria, stock, planificado, disponible, costo, reservas: [{ ticketId, codigo, cliente }] }]` (disponible = stock − planificado en otros tickets en pendiente).
- `PATCH /api/tickets/:id/status {nuevoEstado, cobro?{metodo}}`: al aprobar, si falta stock → 409 `{ code: 'insufficient_stock', message: 'Falta 1 Pantalla A53 OLED', faltantes: [{ productoId, nombre, necesita, hay }] }`, sin cambios (compensa lo ya descontado). Al entregar el monto del cobro = saldo calculado por el servidor (el cliente solo manda `metodo`); suma 1 sello.
- `PATCH /api/tickets/:id/piezas`: quitar/reducir una pieza `descontada` la devuelve al stock (`ticket_devolucion`); agregar en ticket aprobado/trabajando/listo la descuenta (409 si falta).
- `POST /api/tickets/:id/reveal-clave` → `{ tipo, valor }` y registra auditoría `{ usuarioId, usuarioEmail, fecha }` en `ticket.auditoriaClave[]`.
- `GET /api/cobros?from=YYYY-MM-DD&to=YYYY-MM-DD` → `[{ id, origen, referenciaId, codigo, tipo: adelanto|saldo|venta, monto, metodo: efectivo|yape, fecha, anulado, anuladoPor?, anuladoAt?, motivoAnulacion? }]` (fecha en día de Lima).
- `POST /api/cobros/:id/anular {motivo}` (solo owner) → cobro con `anulado: true`; no se borra; queda fuera de los totales.
- `GET /api/community/clients/:id/tickets` → `[{ id, codigo, titulo, estado, equipo, precioTotal, saldo, fechaIngreso }]`.
- `GET /api/technicians` (admins); `POST|PATCH /api/technicians` (solo owner, `@Roles('owner')`).
- Movimientos de stock con el usuario real (`userId`, `userEmail` del JWT), nunca un email fijo.

### Tareas
- [x] C1 — Backend (`backend/src/tickets/**` + rutas en `community`, `cobros`): contrato completo, 409 + compensación al aprobar, devolución al quitar pieza, auditoría reveal, cobros por fecha + anular, owner guard técnicos, usuario real en movimientos, `TICKET_SECRET_KEY` obligatoria (≥32, sin fallback), bloqueo optimista (versión) en update, eliminar ruta duplicada `/estado`, tests (cipher, cobros, piezas, 409, e2e de `POST /tickets` con el payload del formulario). Route: delegated.
- [x] C2 — Frontend tickets (`frontend/src/admin/tickets/**`): formulario vacío, clave sin valores inventados y validada, payload según contrato, marca/modelo desde el catálogo (+ agregar celular), piezas vía `/availability` con "Reservada para", avisos con `notify(mensaje, {type})`, entregar con monto fijo = saldo + línea "+1 sello", error 409 de aprobación con faltantes, comprobante con dirección real (Av. San Luis 1859, San Borja · MultiMercado San Borja · +51 924 548 268) y link `${origin}/ticket/${publicToken}`, página `/admin/tecnicos` (solo owner) + ítem en el menú. Route: delegated (parallel with C1, contract above).
- [x] C3 — Frontend Historial + Cliente (`frontend/src/admin/cash-closings/**`, `frontend/src/admin/clients/**`): filas bloqueadas de cobros en la grilla (suman a efectivo/Yape, candado, "Adelanto AT-000148"), botón "Anular cobro" (owner), pestaña "Historial de servicios" en el detalle del cliente usando `GET /community/clients/:id/tickets`. Route: delegated (after C1 contract is live).
- [x] C4 — QA del orquestador: checks completos + navegador Playwright (crear ticket AT-000002, adelanto Yape, comprobante con QR real y direccion San Borja, pagina publica responsiva, cobros y ventas en Historial).

### Evidencia
- C1: contrato completo. Aprobar valida todo, descuenta atómico con compensación y 409 insufficient_stock + faltantes; PATCH piezas hace diff (devuelve / descuenta); entregar calcula el saldo en el servidor; auditoría reveal-clave (auditoriaClave[]); usuario real en movimientos e historial; bloqueo optimista `version` → 409 ticket_modified; PATCH /:id (notas/título/técnico); cobros por rango Lima + anular (owner); técnicos {id,nombre,activo,ticketsEnCurso} owner-only; GET /community/clients/:id/tickets montado desde tickets (evita dependencia circular); TICKET_SECRET_KEY obligatoria (≥32) sin fallback; filtro global de errores pasa campos extra (solo los de HttpException). Eliminadas rutas duplicadas /estado y GET /clave. Orquestador: build OK, pnpm test 158/158, test:e2e 56/56.
- C3: filas bloqueadas de cobros en la grilla del Historial (candado, efectivo/Yape por método, anulados tachados y fuera de totales, no editables/pegables), totales del día y resumen semana/mes incluyen cobros, línea "Cobros de tickets", "Anular cobro" solo owner con motivo (409/403 manejados), pestañas Fidelización / Historial de servicios en el detalle del cliente (GET /community/clients/:id/tickets, reutiliza TicketStatusBadge). lint limpio, build OK.
- C2: NewTicketDrawer vacío, clave validada sin valores inventados, payload según contrato, marca/modelo desde catálogo + "Agregar celular", piezas vía /availability con "Reservada para", avisos notify(mensaje,{type}), diálogo 409 con faltantes, entregar con monto = saldo (solo lectura) + "+1 sello", comprobante con dirección real y link /ticket/<token>, reveal-clave auditado con auto-ocultado 30 s, página /admin/tecnicos + menú (owner). lint limpio, build OK.

## Fase D — Ventas en el Historial + formulario de ticket (2026-09-26)
Ver ADR 0025 "Actualización (2026-09-26)".
- [x] D1 — Backend: `POST /api/sales` (items, método; descuento atómico + 409 + compensación, movimiento `venta`, cobro tipo venta con items), anular venta devuelve stock (`venta_anulada`); `GET /api/inventory/products?q=` sirve para el buscador; resolución/normalización de marca y celular (`POST /api/inventory/phones/resolve { marca, modelo }` → crea si no existe) usada al crear ticket; `GET /api/tickets/availability` acepta `q` y `categoria` por texto.
- [x] D2 — Frontend Historial: botón "Registrar venta", panel lateral `RegisterSaleDrawer`, filas "Venta · …", línea "Ventas del día", diálogo de anular venta explicando restitución de stock, renombrado a "Historial del día".
- [x] D3 — Frontend ticket: orden 1 Cliente → 2 Equipo → 3 Precio y cierre → 4 Piezas; marca/modelo escritos con sugerencias + normalización; piezas con autocompletado de categoría y filtro por texto, arrancando con el modelo del paso 2; PIN con inputMode="numeric" y limpieza de error reactiva.
- [x] D4 — QA del orquestador: E2E validado con Playwright (creación de ticket AT-000002 con nuevo cliente, adelanto Yape, visualización de comprobante con QR real y datos verídicos, venta rápida de pantalla A53 con decremento de stock a 4 en Kardex, prueba de responsive móvil 375px). Build frontend y backend 100% limpios.
