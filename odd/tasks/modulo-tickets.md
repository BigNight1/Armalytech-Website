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
