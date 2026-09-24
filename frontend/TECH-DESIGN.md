# Technical Design Document: ArmalyTech — Panel de Tickets e Inventario Web

**Tipo de proyecto:** Brownfield — repos existentes revisados: `frontend/` (SPA React + Vite +
Tailwind, `vercel.json`, función serverless `api/contact.js`). Estructura actual:
`frontend/` (SPA existente) + `backend/` (Nuevo, NestJS).
**Design.md disponible:** No — el modelo de datos se derivó del PRD.md. Se usa el PRD y las
decisiones del usuario; la definición del inventario requiere revisar el proyecto de escritorio
Invetario-Armalytech (ADR 0008).

## Resumen

El PRD pide transformar la vitrina estática de ArmalyTech en una herramienta operativa: un panel
administrativo protegido (un solo rol admin/técnico) para gestionar tickets de reparación e
inventario, más un enlace público único por ticket para que el cliente consulte el estado de su
equipo sin cuenta. Se construye sobre el frontend existente (React + Vite + Tailwind en Vercel free
tier), con un **backend nuevo en NestJS**, MongoDB Atlas (free tier) como base de datos, migrando el
inventario desde la SQLite local de Invetario-Armalytech conservando la jerarquía
marcas → modelos → repuestos.

Sobre la misma base se agrega un **módulo de Comunidad** (ADRs 0012–0018): registro de clientes por
QR/NFC físico dentro del local mediante una ruta pública con formulario corto (nombre, apellido,
teléfono peruano normalizado y consentimiento de marketing), desduplicación por número con conteo
de visitas, panel con secciones **Clientes** e **Historial de registro**, y mensajería automatizada
(bienvenida, campañas de promociones y pedido de reseña de Google Maps) orquestada por **n8n** +
**Meta WhatsApp Business API**.

## Arquitectura de componentes

```
┌────────────────────────────────────────────────────────────┐
│  Frontend (SPA React + Vite + Tailwind) — frontend/        │
│  · Sitio público (ya existente)                            │
│  · Panel admin (/admin, layout con sidebar + reloj Lima):  │
│    - Inventario (marcas → modelos → repuestos)  IMPLEMENTADO│
│    - Historial = cierre de caja diario (ADR 0019) IMPLEMENTADO (backend) │
│    - Clientes / tickets                              NUEVO │
│  · Vista pública (/ticket/:publicToken)               NUEVO │
│  · Ruta comunidad (/registrar/usuario)                NUEVO │
└───────────────┬────────────────────────────────────────────┘
                │ fetch JSON (REST), src/admin/<feature>/api/*
┌───────────────▼────────────────────────────────────────────┐
│  Backend NestJS — backend/ (IMPLEMENTADO: auth, inventory, │
│  cash-closings; NUEVO: tickets, comunidad)                 │
│  · Features en Clean Architecture (ADR 0020):              │
│    domain/application/infrastructure por feature           │
│  · Módulos: Auth, Inventory, CashClosings, Tickets (NUEVO),│
│    Community (registro clientes + historial, NUEVO)        │
│  · Guards de autorización + Pipes de validación            │
│  · Corriendo como función serverless en Vercel /api/*      │
└───────────────┬────────────────────────────────────────────┘
                │ @nestjs/mongoose (conexión cacheada)
┌───────────────▼────────────────────────────────────────────┐
│  MongoDB Atlas (free tier M0)                              │
│  colecciones: tickets (NUEVO), brands/models/parts,        │
│  cashClosingRows (cierre de caja), admin, clientes,        │
│  historial (comunidad, NUEVO)                              │
└────────────────────────────────────────────────────────────┘

· n8n (automatización de mensajería) — NUEVO: recibe webhooks del
  backend (registro creado, ticket entregado) y llama a la Meta
  WhatsApp Business API (bienvenida, campañas, pedido de reseña)
· Script one-off de migración (Node) — SQLite Invetario-Armalytech → MongoDB, fuera del runtime
  (PENDIENTE: revisar el proyecto desktop para definir el mapping, ADR 0008)
```

Ya existía: la SPA (frontend/) y el deploy en Vercel. Nuevo: backend NestJS (backend/), panel,
vista pública de ticket, base MongoDB con colección admin, ciclo de abandono de tickets, módulo de
comunidad (clientes + historial) e integración n8n + Meta WhatsApp Business API.

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-stack-frontend-react-vite.md) | Stack del frontend | Aceptado (heredado) |
| [ADR-0002](adrs/0002-despliegue-vercel-free-tier.md) | Despliegue Vercel free tier (frontend + backend NestJS serverless) | Aceptado (heredado) |
| [ADR-0003](adrs/0003-base-de-datos-mongodb-atlas.md) | MongoDB Atlas con Mongoose, sin backups en esta versión | Aceptado |
| [ADR-0004](adrs/0004-autenticacion-panel-admin.md) | Auth: hash en MongoDB + cookie firmada + Guards | Aceptado |
| [ADR-0005](adrs/0005-contrato-de-api-rest.md) | Contrato de API REST en JSON (Controllers NestJS) | Aceptado |
| [ADR-0006](adrs/0006-modelo-de-datos-tickets-e-inventario.md) | Modelo de datos + atomicidad de stock (update condicional, cascada) | Aceptado |
| [ADR-0007](adrs/0007-estados-del-ticket.md) | 5 estados (incluye abandonado) + ciclo 7/15 días | Aceptado |
| [ADR-0008](adrs/0008-migracion-de-inventario-desde-sqlite.md) | Migración SQLite (schema desktop revisado, script implementado) | Aceptado |
| [ADR-0009](adrs/0009-manejo-de-estado-en-el-frontend.md) | Manejo de estado en el frontend | Aceptado |
| [ADR-0010](adrs/0010-resiliencia-y-manejo-de-errores.md) | Resiliencia y manejo de errores | Aceptado |
| [ADR-0011](adrs/0011-backend-nestjs.md) | Backend con NestJS | Aceptado |
| [ADR-0012](adrs/0012-registro-comunidad-qr-nfc.md) | Registro a la comunidad vía QR/NFC (ruta pública) | Aceptado |
| [ADR-0013](adrs/0013-modelo-datos-clientes-comunidad.md) | Modelo de datos de clientes de la comunidad | Aceptado |
| [ADR-0014](adrs/0014-normalizacion-numeros-whatsapp.md) | Normalización de números de WhatsApp peruanos | Aceptado |
| [ADR-0015](adrs/0015-consentimiento-marketing-meta.md) | Consentimiento explícito de marketing (política Meta) | Aceptado |
| [ADR-0016](adrs/0016-integracion-n8n-meta-whatsapp.md) | Integración n8n + Meta WhatsApp Business API | Aceptado |
| [ADR-0017](adrs/0017-resenas-google-maps.md) | Pedido de reseña en Google Maps post-entrega | Aceptado |
| [ADR-0018](adrs/0018-historial-de-registro.md) | Historial de registro y asistencias | Aceptado |
| [ADR-0019](adrs/0019-historial-panel-cierre-caja.md) | Historial del panel = cierre de caja diario | Aceptado |
| [ADR-0020](adrs/0020-arquitectura-limpia-por-feature.md) | Arquitectura limpia por feature (backend y frontend) | Aceptado |

## Modelo de datos

Colecciones MongoDB (detalle en ADR-0006):

- **tickets**: cliente (nombre, apellido, teléfono), equipo (tipo, marca, modelo, descripción),
  estado (pendiente | trabajando | listo | entregado | abandonado), notas[], publicToken (aleatorio,
  índice único), repuestosUsados[], historialEstados[], fechas. Contador de 7 días sin cambio →
  `abandonado`; 15 días en abandonado → eliminar o conservar (por definir). **NUEVO, pendiente.**
- **brands** → **models** (brandId) → **parts** (modelId, quantity): jerarquía del inventario
  migrada desde SQLite (`backend/scripts/migrate-sqlite.ts`, ADR 0008), referencia garantizada a
  nivel de aplicación; ajuste de `quantity` por update condicional atómico (ADR 0006 actualizado).
  **Implementado.**
- **cashClosingRows**: fila de la planilla de cierre de caja diario — `date`, `rowIndex`,
  `cashIncome`, `yapeIncome`, `incomeDetail`, `cashExpense`, `yapeExpense`, `expenseDetail`. Es el
  "Historial" del sidebar del panel (ADR 0019), no el `historial` de comunidad del ADR 0018.
  **Implementado.**
- **admin**: username + passwordHash (bcrypt), creado en bootstrap; el hash vive en la base,
  no en variables de entorno. **Implementado.**
- **clientes** (ADR-0013): nombre, apellido, telefono (E.164 peruano, índice único), visitas,
  consentimiento {aceptado, fecha}, creadoEn, ultimaVisitaEn. El registro usa upsert: número
  existente → incrementa visitas, no duplica.
- **historial** (ADR-0018): clienteId, telefono, tipoEvento (registro | visita |
  registro_rechazado), motivoRechazo, fecha, canal (qr | nfc). Índices por fecha y teléfono.

## Panel admin — estado actual (Inventario + Historial)

Implementado sobre `backend/` y `frontend/src/admin/` (ver `odd/tasks/panel-inventario-historial.md`
para el detalle de tareas y evidencia):

- **Layout del panel**: `AdminLayout` con sidebar (Inventario, Historial) y reloj de cabecera en
  hora de Lima (`America/Lima`), actualizado cada segundo (`src/admin/shared/layout/LimaClock.jsx`,
  `src/admin/shared/lib/time.js`). Rutas protegidas por `RequireAuth`; sin sesión, redirige a
  `/admin/login`.
- **Auth**: cookie de sesión firmada httpOnly, bootstrap del admin desde `ADMIN_USERNAME`/
  `ADMIN_PASSWORD` (ADR 0004).
- **Inventory** (`GET|POST /api/inventory/brands`, `.../:brandId/models`, `.../:modelId/parts`,
  `PATCH|DELETE` por id, `POST /api/inventory/parts/:id/adjust`, `GET /api/inventory/search`):
  CRUD de marcas/modelos/repuestos, ajuste de stock atómico con `409` si no alcanza, cascada al
  eliminar, búsqueda cruzada.
- **Cash closings** — "Historial" del sidebar (ADR 0019): `GET /api/cash-closings?from&to`,
  `PUT /api/cash-closings/:date/rows/:rowIndex` (upsert de fila), `DELETE .../:rowIndex`,
  `GET /api/cash-closings/summary?from&to&groupBy=day|week|month`. UI: planilla editable en línea
  con totales por día/semana/mes.
- **Arquitectura**: ambos módulos siguen Clean Architecture por feature (ADR 0020) —
  `domain/application/infrastructure` en el backend, container/presentational + `api/` service
  layer en el frontend (`src/admin/<feature>/{api,hooks,components}` + `<Feature>Page.jsx`).

## Integración externa de mensajería

- **n8n** (ADR-0016): recibe webhooks del backend NestJS (nuevo registro, ticket entregado) y
  orquesta la mensajería. NestJS es el dueño del registro; n8n nunca escribe en la base.
- **Meta WhatsApp Business Cloud API** (ADR-0016): número de negocio verificado; mensajes en
  ventana de 24h como sesión, fuera de ventana con plantillas aprobadas. Solo a clientes con
  `consentimiento.aceptado === true` (ADR-0015).
- **Reseñas Google Maps** (ADR-0017): al pasar un ticket a `entregado`, n8n envía un link directo
  al formulario de reseña de la ficha del negocio. No se autopublica nada (prohibido por Google).

## Criterios de aceptación por flujo

### Flujo: autenticación del panel

- [ ] Se crea el admin en bootstrap con password hasheado guardado en MongoDB (colección `admin`).
- [ ] Con credenciales válidas, el admin llega al panel y queda autenticado; con inválidas, `401` y
      no emite cookie.
- [ ] Las rutas del panel responden `401` sin sesión válida (Guard de NestJS).
- [ ] La cookie es `httpOnly`, `secure`, `SameSite=Lax` y expira; `/api/auth/logout` la invalida.

### Flujo: creación y gestión de tickets (admin)

- [ ] Se crea un ticket con tipo de equipo, nombre/apellido/teléfono del cliente y estado inicial
      `pendiente`; el sistema genera el `publicToken` aleatorio.
- [ ] El estado avanza por las transiciones pendiente → trabajando → listo → entregado; cada cambio
      queda en `historialEstados` con fecha.
- [ ] Un ticket permite agregar notas/comentarios (cambios de horario, piezas pendientes).
- [ ] Un estado equivocado se puede revertir y el historial conserva el rastro.
- [ ] Un ticket sin cambios durante 7 días se marca `abandonado` automáticamente; a los 15 días de
      abandonado se elimina o se conserva según la decisión pendiente.

### Flujo: seguimiento público del cliente

- [ ] El enlace `/ticket/<publicToken>` muestra estado, notas y datos del equipo sin login.
- [ ] Dado otro `publicToken` cualquiera, no se puede acceder al ticket de otro cliente (no
      secuencial, no adivinable).
- [ ] **PENDIENTE**: recuperación de enlace perdido por teléfono. Falta definir el endpoint, qué
      información se muestra y cómo se protege para no exponer tickets de otros clientes con el
      mismo número.

### Flujo: inventario y stock

- [ ] El admin crea/edita/elimina marcas, modelos y repuestos desde el panel.
- [ ] Al registrar un repuesto usado que deja `cantidad` en 0, la operación completa y la API
      devuelve advertencia `warning.stock_zero` visible para el admin.
- [ ] **PENDIENTE**: definir mecanismo de atomicidad para el decremento de stock (transacción
      Mongoose vs. update condicional) antes de implementar.

### Flujo: migración

- [ ] **PENDIENTE**: revisar el proyecto de escritorio Invetario-Armalytech (schema/estructura de la
      SQLite) para definir el mapping del inventario.
- [ ] El script one-off lee la SQLite, exporta marcas/modelos/repuestos sin perder jerarquía y con
      conteos por entidad en dry-run.
- [ ] Ejecutado contra Atlas, los datos quedan disponibles en el panel y re-ejecutar no duplica
      registros (idempotente).

### Flujo: registro a la comunidad (público)

- [ ] La ruta pública `/registrar/usuario` (nombre provisional, ADR-0012) muestra el formulario con
      nombre, apellido, teléfono y checkbox de consentimiento.
- [ ] `POST /api/comunidad/registro` valida el número peruano y lo normaliza a `51XXXXXXXXX`
      (ADR-0014); un número inválido devuelve error y registra el evento `registro_rechazado`.
- [ ] Un envío sin consentimiento devuelve `400` y no crea cliente (ADR-0015).
- [ ] Primer registro: crea el cliente con `visitas: 1` y escribe evento `registro` (+ `historial`).
- [ ] Número existente: no duplica; incrementa `visitas`, actualiza `ultimaVisitaEn` y escribe
      evento `visita` (ADR-0013/0018).
- [ ] Tras persistir, el backend notifica a n8n por webhook (ADR-0016) sin que n8n escriba en la base.

### Flujo: panel de clientes e historial (admin)

- [ ] `/admin/clientes` lista los clientes con nombre, teléfono (normalizado), visitas, fecha de
      registro y última visita.
- [ ] `/admin/historial` muestra la línea de tiempo de eventos (registro/visita/rechazados) con
      motivo y canal.
- [ ] El panel muestra el total de clientes registrados (contador) y permite buscar por número.
- [ ] Las rutas del panel responden `401` sin sesión válida (mismo Guard de Auth que tickets).

### Flujo: reseña de Google Maps post-entrega

- [ ] Al marcar un ticket como `entregado`, el backend notifica a n8n (ADR-0016/0017).
- [ ] n8n envía el pedido de reseña con el link directo de Google Maps solo si el cliente tiene
      consentimiento y está en la colección `clientes`.
- [ ] El flujo no autopublica reseñas; solo entrega el enlace (ADR-0017).

## Riesgos técnicos abiertos

- ~~**Definición del inventario bloqueada**~~ — **Resuelto (2026-09-23)**: se revisó el proyecto
  desktop `Invetario-Armalytech` (schema `brands`/`models`/`parts`/`cierre_dia`) y se implementó
  `backend/scripts/migrate-sqlite.ts` idempotente (ADR 0008).
- ~~**Atomicidad del stock sin decidir**~~ — **Resuelto (2026-09-23)**: update condicional atómico
  (`$inc` con filtro `cantidad >= n`, `409` si no alcanza) en vez de transacción Mongoose (ADR 0006
  actualizado).
- ~~**Consistencia jerárquica sin FKs**~~ — **Resuelto (2026-09-23)**: borrado en cascada al
  eliminar marca/modelo, replicando las FKs `ON DELETE CASCADE` de la SQLite desktop (ADR 0006
  actualizado).
- **Recuperación de enlace por teléfono sin definir**: el PRD exige el caso borde, pero el contrato,
  la información expuesta y la protección contra acceso cruzado están pendientes (ADR 0005).
- **Sin backups (decisión explícita)**: un error en la migración o un borrado accidental puede
  perder datos; mitigación mínima: dry-run + re-import desde SQLite (ADR 0003).
- **Ciclo de abandono 7/15 días**: falta confirmar si el ticket abandonado se elimina o se conserva,
  y qué pasa si reaparece el cliente (ADR 0007).
- **Seguridad de la sesión**: la cookie firmada y el hash del admin son la barrera del panel
  (ADR-0004); un `SESSION_SECRET` débil expondría tickets e inventario; revocación central no existe.
- **Límites del free tier**: cold starts del backend NestJS y ~512 MB de Atlas bastan hoy, pero se
  deben monitorear al crecer inventario.
- **Nombre de la ruta comunidad**: provisional (`/registrar/usuario`); cambiarla obliga a regenerar
  QR/NFC físicos (ADR-0012).
- **Consentimiento**: falta definir el mecanismo de revocación (p. ej. respuesta "BAJA" por
  WhatsApp vs. gestión manual en el panel) (ADR-0015).
- **Secretos n8n ↔ backend**: el webhook público de n8n debe protegerse con token; definir manejo de
  variables de entorno en Vercel (ADR-0016).
- **Plantillas Meta**: bienvenida/oferta/reseña requieren aprobación de Meta antes de campañas fuera
  de la ventana de 24h; esto es un paso administrativo externo (ADR-0016).
- **URL de reseña de Google Maps**: debe verificarse la URL correcta de la ficha del negocio en
  producción antes de activar el flujo (ADR-0017).
- **Bienvenida automática**: asumida por defecto al registrarse; pendiente confirmar si el usuario
  prefiere envío manual (ADR-0016).