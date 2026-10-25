# Technical Design Document: ArmalyTech — Panel de Tickets e Inventario Web

**Tipo de proyecto:** Brownfield — repos existentes revisados: `frontend/` (SPA React + Vite +
Tailwind, `vercel.json`, función serverless `api/contact.js`). Estructura actual:
`frontend/` (SPA existente) + `backend/` (Nuevo, NestJS).
**Design.md disponible:** Sí — [DESIGN.md](DESIGN.md) documenta el sistema visual (tokens, componentes,
los 7 estados del ticket en la interfaz y los tres contextos de producto). Este documento parte de
[PRD.md](PRD.md) y de ese sistema de diseño; la definición del inventario requirió además revisar el
proyecto de escritorio Invetario-Armalytech (ADR 0008).

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
  (IMPLEMENTADO: `backend/scripts/migrate-sqlite.ts`, idempotente y con `--dry-run`, ADR 0008)
```

Ya existía: la SPA (frontend/) y el deploy en Vercel. Nuevo: backend NestJS (backend/), panel,
vista pública de ticket, base MongoDB con colección admin, ciclo de abandono de tickets, módulo de
comunidad (clientes + historial) e integración n8n + Meta WhatsApp Business API.

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](docs/adrs/0001-stack-frontend-react-vite.md) | Stack del frontend | Aceptado (heredado) |
| [ADR-0002](docs/adrs/0002-despliegue-vercel-free-tier.md) | Despliegue Vercel free tier (frontend + backend NestJS serverless) | Aceptado (heredado) |
| [ADR-0003](docs/adrs/0003-base-de-datos-mongodb-atlas.md) | MongoDB Atlas con Mongoose, sin backups en esta versión | Aceptado |
| [ADR-0004](docs/adrs/0004-autenticacion-panel-admin.md) | Auth: hash en MongoDB + cookie firmada + Guards | Reemplazado por 0021 |
| [ADR-0005](docs/adrs/0005-contrato-de-api-rest.md) | Contrato de API REST en JSON (Controllers NestJS) | Aceptado |
| [ADR-0006](docs/adrs/0006-modelo-de-datos-tickets-e-inventario.md) | Modelo de datos + atomicidad de stock (update condicional, cascada) | Aceptado |
| [ADR-0007](docs/adrs/0007-estados-del-ticket.md) | 5 estados (incluye abandonado) + ciclo 7/15 días | Aceptado |
| [ADR-0008](docs/adrs/0008-migracion-de-inventario-desde-sqlite.md) | Migración SQLite (schema desktop revisado, script implementado) | Aceptado |
| [ADR-0009](docs/adrs/0009-manejo-de-estado-en-el-frontend.md) | Manejo de estado en el frontend | Aceptado |
| [ADR-0010](docs/adrs/0010-resiliencia-y-manejo-de-errores.md) | Resiliencia y manejo de errores | Aceptado |
| [ADR-0011](docs/adrs/0011-backend-nestjs.md) | Backend con NestJS | Aceptado |
| [ADR-0012](docs/adrs/0012-registro-comunidad-qr-nfc.md) | Registro a la comunidad vía QR/NFC (ruta pública) | Aceptado |
| [ADR-0013](docs/adrs/0013-modelo-datos-clientes-comunidad.md) | Modelo de datos de clientes de la comunidad | Aceptado |
| [ADR-0014](docs/adrs/0014-normalizacion-numeros-whatsapp.md) | Normalización de números de WhatsApp peruanos | Aceptado |
| [ADR-0015](docs/adrs/0015-consentimiento-marketing-meta.md) | Consentimiento explícito de marketing (política Meta) | Aceptado |
| [ADR-0016](docs/adrs/0016-integracion-n8n-meta-whatsapp.md) | Integración n8n + Meta WhatsApp Business API | Aceptado |
| [ADR-0017](docs/adrs/0017-resenas-google-maps.md) | Pedido de reseña en Google Maps post-entrega | Aceptado |
| [ADR-0018](docs/adrs/0018-historial-de-registro.md) | Historial de registro y asistencias | Aceptado |
| [ADR-0019](docs/adrs/0019-historial-panel-cierre-caja.md) | Historial del panel = cierre de caja diario | Aceptado |
| [ADR-0020](docs/adrs/0020-arquitectura-limpia-por-feature.md) | Arquitectura limpia por feature (backend y frontend) | Aceptado |
| [ADR-0021](docs/adrs/0021-autenticacion-jwt-en-cookie.md) | Auth con `@nestjs/jwt` en cookie httpOnly + `tokenVersion` | Aceptado |
| [ADR-0022](docs/adrs/0022-usuarios-y-roles-fijos.md) | Usuarios del panel con roles fijos (`owner`, `admin`) | Aceptado |
| [ADR-0023](docs/adrs/0023-seccion-personal.md) | Sección Personal: alta con contraseña temporal, desactivar, resetear | Aceptado |
| [ADR-0024](docs/adrs/0024-seccion-cuenta.md) | Sección Cuenta: cambiar username/contraseña con contraseña actual | Aceptado |
| [ADR-0025](docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md) | Integración Tickets ↔ Clientes ↔ Inventario ↔ Historial de Caja (piezas, cobros, clave cifrada) | Aceptado |
| [ADR-0026](docs/adrs/0026-bot-whatsapp-ventana-24h-y-resena.md) | Bot de WhatsApp en n8n: ventana de 24 h y pedido de reseña al entregar | Aceptado |
| [ADR-0027](docs/adrs/0027-mensajes-rapidos-desde-el-panel.md) | Mensajes rápidos de WhatsApp desde el panel (envío manual) | Aceptado |
| [ADR-0028](docs/adrs/0028-tiempo-real-sse-invalidacion.md) | Tiempo real en el panel con SSE + invalidación de React Query | Aceptado |
| [ADR-0029](docs/adrs/0029-plantillas-whatsapp-via-kapso.md) | Envío de plantillas de WhatsApp desde NestJS mediante Kapso | Aceptado |

## Modelo de datos

Colecciones MongoDB (detalle en ADR-0006):

- **tickets**: cliente (nombre, apellido, teléfono), equipo (tipo, marca, modelo, descripción),
  estado (**7 estados**: pendiente | aprobado | trabajando | listo | entregado | cancelado |
  abandonado — ADR 0007, "Actualización (2026-09-25)"), notas[], publicToken (aleatorio,
  índice único), repuestosUsados[], historialEstados[], fechas. Contador de 7 días sin cambio →
  `abandonado`; 15 días en abandonado → eliminar o conservar (por definir).
  **IMPLEMENTADO** (`backend/src/tickets/`). Salvedad: el paso automático a `abandonado` exige un
  job programado que **no existe todavía** (ver [BACKLOG.md](BACKLOG.md), E3).
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
- **Auth**: hoy es una cookie de sesión firmada httpOnly, con bootstrap del admin desde
  `ADMIN_USERNAME`/`ADMIN_PASSWORD` (ADR 0004). **Planificado:** JWT en cookie httpOnly con
  `tokenVersion` (ADR 0021), usuarios con roles `owner`/`admin` (ADR 0022) y las secciones
  Personal (ADR 0023) y Cuenta (ADR 0024).
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

### Flujo: autenticación del panel (ADR 0021, 0022)

- [ ] En el bootstrap se crea el usuario `ADMIN_USERNAME` con `role: owner`, con la contraseña
      hasheada en la colección `users`. El admin existente en `admins` se migra a `users` como
      `owner`.
- [ ] Con credenciales válidas y usuario activo, `POST /api/auth/login` emite una cookie
      `httpOnly` (`secure` en producción, `SameSite=Lax`) con un JWT que contiene `sub`,
      `username`, `role` y `tokenVersion`. Con credenciales inválidas o un usuario inactivo,
      responde `401` sin cookie y con un mensaje genérico.
- [ ] Toda ruta del panel responde `401` sin JWT válido, con el JWT vencido o cuando el
      `tokenVersion` del JWT no coincide con el guardado.
- [ ] Una ruta con `@Roles('owner')` responde `403` a un usuario `admin`.
- [ ] `GET /api/auth/me` devuelve `id`, `username`, `role` y `mustChangePassword`.
- [ ] `POST /api/auth/logout` borra la cookie.
- [ ] El login funciona igual desde el navegador del celular.

### Flujo: sección Personal (owner, ADR 0023)

- [ ] Un usuario `admin` no ve "Personal" en el sidebar, y `GET /api/staff` le responde `403`.
- [ ] El `owner` ve la lista (usuario, rol, estado, creado por, fecha) y el detalle de cada usuario.
- [ ] Crear un usuario con username y contraseña temporal lo deja con `role: admin` y
      `mustChangePassword: true`. Un username repetido (sin distinguir mayúsculas) responde `409`.
- [ ] En su primer ingreso, el usuario nuevo solo ve la pantalla "Crea tu nueva contraseña". Las
      demás rutas del API le responden `403` hasta que la cambie.
- [ ] Desactivar un usuario corta sus sesiones abiertas: su próximo request responde `401` y ya no
      puede iniciar sesión. Reactivarlo le devuelve el acceso.
- [ ] Resetear la contraseña deja otra temporal, vuelve a poner `mustChangePassword: true` y
      cierra sus sesiones.
- [ ] El `owner` no puede desactivarse a sí mismo, y siempre queda al menos un `owner` activo.
      Si una acción lo impediría, responde `409`.

### Flujo: sección Cuenta (todos, ADR 0024)

- [ ] Cambiar el username o la contraseña con una contraseña actual incorrecta responde `401` y
      no cambia nada.
- [ ] La contraseña nueva debe tener al menos 8 caracteres y ser distinta de la actual; si no,
      responde `400` con el motivo.
- [ ] Después de un cambio exitoso, el usuario sigue conectado en el dispositivo actual (recibe un
      JWT nuevo) y sus sesiones en otros dispositivos responden `401`.
- [ ] Un username nuevo ya tomado responde `409`.

### Flujo: creación y gestión de tickets (admin)

- [ ] Se crea un ticket con tipo de equipo, nombre/apellido/teléfono del cliente y estado inicial
      `pendiente`; el sistema genera el `publicToken` aleatorio.
- [ ] El estado avanza por las transiciones pendiente → trabajando → listo → entregado; cada cambio
      queda en `historialEstados` con fecha.
- [ ] Un ticket permite agregar notas/comentarios (cambios de horario, piezas pendientes).
- [ ] Un estado equivocado se puede revertir y el historial conserva el rastro.
- [ ] Un ticket sin cambios durante 7 días se marca `abandonado` automáticamente; a los 15 días de
      abandonado se elimina o se conserva según la decisión pendiente.
      **Estado:** la transición manual existe; el paso automático **no** está implementado (no hay job
      programado). Queda como deuda P2 en [BACKLOG.md](BACKLOG.md).

### Flujo: seguimiento público del cliente

- [x] El enlace `/ticket/<publicToken>` muestra estado, notas y datos del equipo sin login.
- [x] Dado otro `publicToken` cualquiera, no se puede acceder al ticket de otro cliente (no
      secuencial, no adivinable).
- [x] **Resuelto (implementado):** recuperación de enlace perdido con `POST /api/tickets/public/lookup`
      (`codigo` + `telefono` → `publicToken`). Exige **ambos** datos y compara el celular normalizado a
      dígitos, así que conocer el código no basta para abrir el ticket de otro cliente. Verificado en
      `e2e/tests/public-ticket-tracking.spec.ts`.
- [x] La página se refresca sola cuando cambia el estado (polling de 30 s + `visibilitychange` en
      `frontend/src/ticket/TicketPage.jsx`), que es lo que el copy le promete al cliente.

### Flujo: inventario y stock

- [x] El admin crea/edita/elimina marcas, modelos y repuestos desde el panel.
- [~] Al registrar un repuesto usado que deja el stock en 0, la API lo informa de forma explícita.
      **Estado:** el código `warning.stock_zero` de este documento **no** se implementó. La decisión
      final (ADR 0025) es más estricta: si no hay stock, la operación no se completa y responde
      `409 insufficient_stock` con el detalle (`faltantes: [{ productoId, nombre, necesita, hay }]`),
      que el panel muestra nombrando la pieza. Cumple el caso borde del PRD ("avisar, no bloquear en
      silencio"), pero con otro contrato.
- [x] **Resuelto:** el decremento de stock es un update condicional atómico (`$inc` con filtro
      `cantidad >= n`, `409 insufficient_stock` con el detalle de faltantes), no una transacción
      Mongoose. Ver ADR 0006, "Actualización (2026-09-25)", y la sección de riesgos de este documento.

### Flujo: migración

- [x] **Resuelto:** se revisó el schema del proyecto de escritorio
      (`brands`/`models`/`parts`/`cierre_dia`). Decisión posterior: el inventario v2 arranca vacío y
      el script migra **solo** `cierre_dia` (ADR 0008 y ADR 0006, "Actualización (2026-09-25)").
- [x] El script one-off lee la SQLite, exporta y reporta conteos en `--dry-run`
      (`backend/scripts/migrate-sqlite.ts`).
- [x] Ejecutado contra Atlas, re-ejecutar no duplica registros (upsert por clave natural).

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
- ~~**Recuperación de enlace por teléfono sin definir**~~ — **Resuelto (2026-10-25)**: se implementó
  `POST /api/tickets/public/lookup` (`codigo` + `telefono` → `publicToken`), con ambos datos
  obligatorios y comparación del celular normalizado a dígitos. El criterio de "no exponer tickets
  ajenos con el mismo número" se cumple porque el código también es obligatorio y el `publicToken`
  sigue siendo la única llave de lectura.
- **Sin backups (decisión explícita)**: un error en la migración o un borrado accidental puede
  perder datos; mitigación mínima: dry-run + re-import desde SQLite (ADR 0003).
- **Ciclo de abandono 7/15 días**: falta confirmar si el ticket abandonado se elimina o se conserva,
  y qué pasa si reaparece el cliente (ADR 0007). Además, el paso automático a `abandonado` no tiene
  job programado todavía (ver [BACKLOG.md](BACKLOG.md), E3).
- **Seguridad de la sesión**: el JWT firmado con `JWT_SECRET` y el hash de cada usuario son la
  barrera del panel (ADR-0021). Un secreto débil expondría todo el panel. La revocación se hace
  por `tokenVersion`. No hay recuperación de contraseña por correo: la resetea el `owner` (ADR
  0023, ADR 0024).
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