# BACKLOG — ArmalyTech

**Estado del trabajo del producto.** Corte: último commit `ff32c9d` (2026-10-11), rama `cambiosNuevos`,
120 commits en total (69 desde el 2026-09-23, cuando arranca el panel). Este documento registra qué está
hecho, qué está abierto y de dónde sale cada afirmación. No decide nada: las decisiones viven en los ADR
y en los specs.

## 1. Qué es este documento y qué no es

| Documento | Responde a | No responde a |
|---|---|---|
| [PRD.md](PRD.md) | qué se construye, para quién y qué queda fuera | cómo se implementa |
| [TECH-DESIGN.md](TECH-DESIGN.md) | arquitectura, riesgos abiertos y criterios de aceptación por flujo | orden ni prioridad del trabajo |
| `docs/adrs/` (29 ADR, formato MADR) | por qué se tomó cada decisión técnica o de producto | estado de avance |
| `odd/tasks/` (14 specs) | contrato de API, fases, tareas y **evidencia** de cada feature | prioridad relativa entre features |
| **BACKLOG.md** (este archivo) | estado real por épica, backlog abierto, deuda y trazabilidad | requisitos nuevos ni diseño |

Cómo leerlo:

- Cada estado se apoya en un archivo del repo o en un commit citado con hash. Lo que no se pudo verificar
  se escribe **"no verificable en el repo"**; no se rellena con estimaciones.
- Las cifras de tests y de QA son las que reportan los propios specs, no una re-ejecución de esta pasada.
- **El árbol no está limpio al corte**: los ADR se movieron de `frontend/adrs/` a `docs/adrs/` y
  `PRD.md`/`TECH-DESIGN.md` a la raíz, sin commitear; `e2e/`, `.github/` y `CLAUDE.md` siguen sin seguimiento.
  Nada se commitea sin pedido ([CLAUDE.md](CLAUDE.md) §1), así que el working tree es parte del estado real.
- El pipeline que declara [CLAUDE.md](CLAUDE.md) §2 incluye también `DESIGN.md` y `SECURITY.md`; este backlog no
  los evalúa: cubre el trabajo (features, deuda y trazabilidad).

## 2. Cómo se prioriza

El repo no tiene un documento de priorización explícito. El criterio que se deduce del orden de los
commits, del contenido de los 14 specs y de lo que cada spec declara como "objetivo" es este:

| # | Criterio | Señal verificable en el repo |
|---|---|---|
| 1 | **Que el mostrador pueda trabajar hoy**: tickets, inventario, caja, clientes | Es lo primero que se commitea (2026-09-23/26) y todas las épicas de operación están cerradas antes de cualquier trabajo de marketing |
| 2 | **Que el dinero cuadre**: cobros, ventas, saldo calculado en el servidor | [ADR 0025](docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md) exige que el monto lo calcule el servidor y que los cobros no se borren, solo se anulen; es la única integración con reglas de negocio explícitas |
| 3 | **Que el cliente no reciba información contradictoria**: garantía, dirección, aviso de "listo" | Los hallazgos de `envio-tickets-whatsapp.md` (garantía 30 días vs 3 meses, dirección 1859 vs 1873) están listados como "hallazgos que conviene arreglar". La dirección ya se cerró el 2026-10-25 (1849-1851); la garantía sigue abierta |
| 4 | **Crecer**: SEO y conversión | Todo el trabajo SEO es del 2026-10-08 al 2026-10-11, después de cerrar el panel, y sus specs repiten "fuera de alcance: panel admin, backend, tickets" |
| 5 | **Lo que depende de una decisión del dueño espera** | Los specs dejan escrito qué está bloqueado por el dueño (dirección, plazos de garantía, precios por modelo, plantillas de Meta, coexistencia del número) en vez de inventar el dato |

Consecuencia práctica de ese orden: la deuda abierta es casi toda de *verificación* (QA en navegador, envío real
de WhatsApp) y de *coherencia documental* (ADR y TECH-DESIGN que quedaron atrás), no de funcionalidad del panel.

## 3. Tablero resumen

| Épica | Spec(s) | Estado | Evidencia | ADRs |
|---|---|---|---|---|
| E1 · Panel base, auth y primer inventario | [panel-inventario-historial.md](odd/tasks/panel-inventario-historial.md) | **Hecho** (inventario v1 reemplazado por E2) | `24b72ba`, `116911d`, `44175c6`, `08c22d4`, `9dedd7a`, `8b11579`, `b76df43`, `d91f9b1` | 0002, 0003, 0004→0021, 0005, 0008, 0011, 0019, 0020 |
| E2 · Inventario v2 (catálogo + Kardex) | [inventario-v2.md](odd/tasks/inventario-v2.md) | **Hecho** con seguimientos | `d13684f`, `4fcf5f7`, `103921e` | 0006 (act. 2026-09-25), 0009, 0010, 0020 |
| E3 · Tickets 360° | [modulo-tickets.md](odd/tasks/modulo-tickets.md) | **Hecho** (C1–C4, D1–D4) | `8f95293`, `43dc6b2`, `7134248`, `612e8ca`, `97ce6d6` | 0006, 0007, 0025, 0022, 0023 |
| E4 · Historial: cierre de caja, cobros y ventas | [modulo-tickets.md](odd/tasks/modulo-tickets.md) (C3/D1–D2) + E1 | **Hecho** | `08c22d4`, `40179d4`, `7134248`, `8f95293`, `43dc6b2`, `23ffe8a`, `26b31b0` | 0019, 0025 |
| E5 · Clientes y fidelización (QR/NFC + sellos) | [panel-inventario-historial.md](odd/tasks/panel-inventario-historial.md) (T11–T13) + E3 | **Hecho** | `95aa029`, `df0b3bd`, `e496086`, `c5512bc`, `630765f` | 0012–0018, 0015 (act.), 0027 |
| E6 · Personal y Cuenta | [panel-inventario-historial.md](odd/tasks/panel-inventario-historial.md) | **Hecho** | `10bc3f9`, `d85c72d`, `291d386`, `a38e52c` | 0021, 0022, 0023, 0024 |
| E7 · Tiempo real (SSE) | [realtime-panel.md](odd/tasks/realtime-panel.md) | **En curso** (T4 pendiente) | `103921e` | 0028 |
| E8 · WhatsApp (plantillas y envío) | [integracion-plantillas-whatsapp.md](odd/tasks/integracion-plantillas-whatsapp.md), [plantillas-whatsapp.md](odd/tasks/plantillas-whatsapp.md), [envio-tickets-whatsapp.md](odd/tasks/envio-tickets-whatsapp.md) | **En curso** (T1–T4 hechas, T5 parcial) | `abb3947`, `97ce6d6`, `ff32c9d` | 0029 (reemplaza 0016 y 0026 §1), 0026, 0027 |
| E9 · Rediseño del panel (Claude Design) | [rediseno-panel.md](odd/tasks/rediseno-panel.md) | **En curso** (R4 pendiente) | `19c693d`, `4fcf5f7`, `103921e` | — (decisión de diseño en `design/`) |
| E10 · Responsive + guard de cambios sin guardar | [responsive-panel.md](odd/tasks/responsive-panel.md), [unsaved-changes-guard.md](odd/tasks/unsaved-changes-guard.md) | **Hecho** (R0–R3, U1–U2) | `3dee709` | 0009, 0010 |
| E11 · SEO (tres tandas) | [seo-arreglos.md](odd/tasks/seo-arreglos.md), [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md), [seo-ctr-precios.md](odd/tasks/seo-ctr-precios.md) | **En curso** (código hecho; H2/H3 y decisiones del dueño abiertos) | `e2ad557`, `f1f9564`, `9372eca` | — (no hay ADR de SEO) |
| E12 · Migración SQLite → Mongo | [panel-inventario-historial.md](odd/tasks/panel-inventario-historial.md) (T5) + [inventario-v2.md](odd/tasks/inventario-v2.md) | **Hecho parcial** (solo `cierre_dia`) | `9e8d359` | 0008 (sin actualizar tras v2) |
| E13 · QA 2026-09-26 y correcciones | [qa-2026-09-26.md](odd/tasks/qa-2026-09-26.md) | **Hecho** salvo "No verificado" | `8f95293`, `43dc6b2`, `7134248`, `612e8ca`, `961b5c6` | 0025 |
| E14 · Despliegue (Vercel, Dokploy, CI) | — (transversal) | **En curso** (CI y suite Playwright sin commitear) | `6a8e754`, `f1a1256`, `2684c1c`, `ff32c9d` | 0002, 0028 |

Resumen: **8 épicas hechas** (E1–E6, E10, E13), **5 en curso** (E7, E8, E9, E11, E14) y **1 parcial** (E12);
ninguna sin empezar. Cuatro dependen de una verificación o acción externa: dos pestañas (E7), envío real de
WhatsApp (E8), deploy y Search Console (E11) y commit/deploy del estado actual (E14).

## 4. Detalle por épica

### E1 · Panel base, auth y primer inventario — Hecho

- **Objetivo:** llevar la app de escritorio `Invetario-Armalytech` (Electron + SQLite) a la web con un panel
  protegido, inventario y una planilla de cierre de caja diario.
- **Alcance:** scaffold NestJS + Mongo, auth con cookie firmada y bootstrap del admin, inventario
  `marcas → modelos → repuestos`, cierre de caja con totales día/semana/mes, script de migración, shell del
  panel con sidebar y reloj de Lima, capa de datos con TanStack Query, grilla Glide y `react-day-picker`.
- **Criterios reales del spec:** sin sesión, `/admin/*` redirige a `/admin/login`; ajustar stock bajo cero
  devuelve `409`; la grilla del Historial edita en línea y muestra totales; el reloj es `America/Lima` y
  actualiza cada segundo.
- **Evidencia:** `24b72ba` scaffold, `116911d` auth, `44175c6` inventario, `08c22d4` cash-closings,
  `9e8d359` migración, `9dedd7a` shell, `8b11579` capa de datos, `b76df43` Glide, `d91f9b1` calendarios.
- **Abierto:** el inventario v1 (marcas/modelos/repuestos) fue **reemplazado** por E2; el código de
  `models`/`parts` ya no existe. El spec conserva su sección de evidencia histórica, no el contrato.

### E2 · Inventario v2: catálogo con compatibilidad por celular + Kardex — Hecho, con seguimientos

- **Objetivo:** reemplazar la jerarquía por un catálogo de productos (accesorios y repuestos) con categoría,
  marca opcional, stock, costo, precio, stock mínimo y lista de celulares compatibles; todo cambio de stock
  escribe un movimiento.
- **Alcance:** backend `inventory/{domain,application,infrastructure}` con marcas, celulares, categorías
  (seed por defecto), productos (archivar/restaurar, filtros, paginación, búsqueda que entiende modelos) y
  movimientos; frontend con pestañas Productos/Catálogo, formulario con multi-select de celulares y ajuste ±.
- **Criterios:** buscar "A54" lista los productos compatibles agrupados por categoría; ajustar bajo cero
  devuelve `409` y aparece en movimientos; borrar una marca/celular/categoría en uso devuelve `409`; tests y
  build en verde.
- **Evidencia:** `d13684f` ADR 0006 actualizado, `4fcf5f7` UI/UX del catálogo, `103921e` consolidación
  (productos, Kardex, tests, búsqueda por texto, `POST /inventory/phones/resolve`).
- **Abierto:** quedaron datos de prueba en la base ("QA Marca", "QA A54", "QA Mica 9H"); el spec pide
  decidir si un producto cuyos únicos movimientos son "Stock inicial" puede borrarse en duro; el layout a
  escritorio ancho no se verificó (panel de ~500 px).

### E3 · Tickets 360° — Hecho

- **Objetivo:** módulo de tickets integrado atómicamente con Clientes (ficha 360°), Inventario (consumo de
  repuestos y Kardex) e Historial (adelanto y saldo), según ADR 0025.
- **Alcance:** 7 estados, correlativo atómico `AT-000001`, token público UUID, clave del equipo cifrada con
  `TICKET_SECRET_KEY` y auditable, piezas con reserva/descuento/devolución, cobros en colección aparte,
  técnicos (solo `owner`), comprobante imprimible y página pública `/ticket/:token`, más consulta pública por
  código + celular y ficha de historial de servicios del cliente.
- **Criterios reales (spec, "Contrato"):** aprobar sin stock devuelve `409 insufficient_stock` con faltantes y
  compensa lo ya descontado; al entregar el monto del saldo lo calcula el servidor (el cliente solo manda el
  método) y suma 1 sello; `GET /api/cobros` filtra por fecha de Lima y `anular` no borra; el movimiento de
  stock lleva el usuario real del JWT; `TICKET_SECRET_KEY` es obligatoria (≥32) sin fallback.
- **Evidencia:** `8f95293` backend (tickets, ventas, resolución de celulares), `43dc6b2` frontend + correcciones
  de QA, `7134248` ventas y cobros visibles en el Historial, `612e8ca` consulta pública segura,
  `961b5c6` fix de parpadeo, `97ce6d6` sección WhatsApp del detalle. QA C4 con Playwright reportado en el spec
  (ticket `AT-000002`, adelanto Yape, comprobante, responsive 375 px).
- **Abierto:** el automatismo de abandono 7/15 días que exige [ADR 0007](docs/adrs/0007-estados-del-ticket.md)
  **no está implementado**: no hay scheduler ni job en `backend/src` (`abandon` solo aparece como valor del
  enum). Verificación en navegador de "anular cobro" y "aprobar sin stock" no quedó registrada (ver E13).

### E4 · Historial: cierre de caja, cobros y ventas — Hecho

- **Objetivo:** que el "Historial" del panel sea la caja del día, con las ventas de mostrador y los cobros de
  ticket dentro de la misma planilla.
- **Alcance:** planilla editable por fila (`PUT /cash-closings/:date/rows/:rowIndex`), resumen día/semana/mes,
  filas de cobro bloqueadas (candado, efectivo/Yape, anulados tachados y fuera de totales), "Anular cobro"
  solo `owner` con motivo, "Registrar venta" con descuento atómico de stock y restitución al anular.
- **Criterios:** los totales incluyen cobros y ventas; las filas de cobro no son editables ni pegables; anular
  una venta devuelve el stock con movimiento `venta_anulada`; el efectivo y el Yape se separan por método.
- **Evidencia:** `08c22d4` módulo base, `40179d4` grilla, `7134248` detalle al clic, `8f95293` ventas y cobros
  en backend, `43dc6b2` venta rápida, `23ffe8a` borrar celdas de dinero con Delete, `26b31b0` columna vacía y
  borrado de filas.
- **Abierto:** ninguno funcional detectado; queda la verificación de anular cobro en navegador (E13).

### E5 · Clientes y fidelización (QR/NFC + sellos) — Hecho

- **Objetivo:** registrar clientes desde el local por QR/NFC, contar visitas y sostener un programa de 5 sellos.
- **Alcance:** alta pública `/registrar/usuario` con teléfono peruano normalizado y consentimiento opcional,
  deduplicación por número, eventos (`registro`, `visita`, `registro_rechazado`), panel de Clientes con
  búsqueda/filtro de consentimiento/actividad, ficha con pestañas Fidelización e Historial de servicios,
  "+1 Visita" con bloqueo por fila y canje de recompensa.
- **Criterios:** un número repetido incrementa visitas y no duplica cliente; un número inválido devuelve `422` y
  registra `registro_rechazado`; el registro no cuenta visita; el consentimiento es opcional (ADR 0015
  actualizado) y una baja posterior lo desactiva.
- **Evidencia:** `95aa029` backend community, `df0b3bd` registro público, `e496086` panel de clientes,
  `c5512bc` fidelización de 5 sellos + visitas manuales, `630765f` métodos de loyalty en el notificador nulo.
  Modelo vigente en `backend/src/community/domain/client.entity.ts` (`stamps`, `loyaltyCycle`, `rewardsClaimed`).
- **Abierto:** el notificador de comunidad sigue enviando **texto libre** a un webhook
  (`webhook-community-notifier.ts`); no hay bienvenida ni campañas automáticas (decisión del dueño; el "BAJA" lo procesa Kapso).

### E6 · Personal y Cuenta — Hecho

- **Objetivo:** varios usuarios con dos roles fijos (`owner`, `admin`) y autogestión de credenciales.
- **Alcance:** JWT en cookie `httpOnly` con `tokenVersion`, alta de personal con contraseña temporal y cambio
  obligatorio al primer ingreso, desactivar/reactivar, resetear contraseña, y sección Cuenta para correo y
  contraseña con invalidación de sesiones remotas.
- **Criterios (TECH-DESIGN):** un `admin` no ve "Personal" y `GET /api/staff` le responde `403`; desactivar un
  usuario corta sus sesiones (`401`); el `owner` no puede desactivarse a sí mismo ni dejar el sistema sin
  `owner` (`409`); cambiar contraseña con la actual incorrecta responde `401`.
- **Evidencia:** `10bc3f9` ADR 0021/0022 (JWT + roles + email), `d85c72d` ADR 0023 (Personal), `291d386`
  ADR 0024 (Cuenta), `a38e52c` proxy de Vite y prefetch.
- **Abierto:** no hay recuperación de contraseña por correo; la resetea el `owner` (decisión de ADR 0023/0024).

### E7 · Tiempo real en el panel (SSE + invalidación de React Query) — En curso

- **Objetivo:** que cualquier panel abierto refleje en ~1 s los cambios de otro admin y los registros públicos.
- **Alcance:** `GET /api/events` (`text/event-stream`) con sesión obligatoria, mensajes `invalidate` por topic
  (`clients`, `tickets`, `sales`, `inventory`, `staff`) y `ping` cada 25 s; publicación desde cada caso de uso
  con un puerto `RealtimePublisher`; en el frontend, `useRealtimeSync` con catch-up al reconectar y nginx con
  bloque propio sin buffering.
- **Criterios:** publicar nunca lanza hacia el caso de uso; los efectos cruzados están tabulados (aprobar toca
  `tickets` + `inventory`, entregar con cobro toca `tickets` + `sales`); reconectar invalida todo una vez sin
  toast.
- **Evidencia:** `103921e` (módulo realtime, controlador SSE, publicación desde los casos de uso de community,
  tickets, técnicos, cobros, ventas, cierre de caja, inventario y personal, tests del bus y del controlador,
  `useRealtimeSync`, nginx, proxy de Vite). Estado de las tareas: T0–T3 `[x]`.
- **Abierto:** **T4** del spec (`[ ]`): revisión final y prueba manual con dos pestañas en Chrome. Además,
  Vercel serverless no mantiene la conexión abierta (ADR 0028), así que el tiempo real solo funciona en el
  despliegue Docker/Dokploy con nginx; `frontend/vercel.ts` no lo soporta y no lo simula.

### E8 · WhatsApp: plantillas y envío de tickets (Kapso) — En curso

- **Objetivo:** enviar desde el panel las plantillas aprobadas por Meta (`ticket_listo`, `resena_google`) con
  registro de cada envío, y recibir estados de entrega, bajas de marketing y `lastInboundAt` (ventana 24 h).
- **Alcance:** módulo genérico `backend/src/whatsapp/` (puerto, adaptador Kapso, adaptador nulo, colecciones
  `whatsapp_messages`, `whatsapp_contacts`, `whatsapp_webhook_events`), `TicketWhatsAppService`, endpoints
  `GET/POST /api/tickets/:id/whatsapp`, envío automático detrás de `WHATSAPP_AUTO_TICKET_LISTO` (apagado),
  webhook `POST /api/webhooks/kapso` con HMAC del cuerpo crudo, idempotencia y sin retroceso de estados.
- **Criterios:** una plantilla se envía una vez por ticket (`409 already_sent` salvo `force`); `resena_google`
  solo si el ticket está `entregado`, hay consentimiento y no hay baja; sin credenciales responde
  `503 whatsapp_not_configured` y el backend arranca igual; el envío no puede revertir un cambio de estado.
- **Evidencia:** `abb3947` (módulo, endpoints, webhook, `rawBody`, tests: 28 suites / 226 unitarios y 9 suites /
  74 e2e según el spec), `97ce6d6` sección WhatsApp en el detalle del ticket, `ff32c9d` arranque de Dokploy con
  `rawBody`. Plantillas `ticket_listo` y `resena_google` aprobadas en Meta y sincronizadas vía Kapso
  (verificado el 2026-10-10, según [ADR 0029](docs/adrs/0029-plantillas-whatsapp-via-kapso.md)).
- **Abierto:** **T5 está en `[~]`**: falta QA en navegador y **envío real** (necesita sesión del dueño y las
  variables de Kapso en el servidor), confirmar el índice `1` del botón URL de la plantilla y cerrar el
  `.env.example` (las líneas se entregaron al dueño porque el agente no podía editarlo). Las tres plantillas de
  marketing (`promo_descuento`, `invitar_volver`, `bienvenida_comunidad`) siguen sin crear en Meta y la decisión
  coexistencia/migración del número está pendiente del dueño.

### E9 · Rediseño del panel (Claude Design + modo oscuro) — En curso

- **Objetivo:** aplicar fielmente el rediseño aprobado (Modernist + colores de marca) sin perder funcionalidad.
- **Alcance:** tokens claro/oscuro, tipografía Archivo, `ThemeProvider` persistido, sidebar agrupado con menú de
  usuario, cabecera con breadcrumb y reloj, login, Cuenta, Inventario, Historial (tema de Glide), Clientes,
  Personal, página pública del ticket y registro público de 4 estados.
- **Criterios:** todas las pantallas del diseño existen; el modo oscuro no usa `dark:` de Tailwind (el `<body>`
  público ya es `dark`, se resuelve con variables CSS); el sitio público no cambia; `lint` y `build` limpios.
- **Evidencia:** `19c693d` panel rediseñado, `4fcf5f7` y `103921e` ajustes; R1–R3 y R5 marcadas `[x]` con
  evidencia por agente en el spec (R4a corrige `:where()` en los headings, `size` en `Input`/`Select`,
  `Modal` con `variant="drawer"`, `ConfirmDialog` con icono y reubica "Cambiar contraseña" en Configuración).
- **Abierto:** **R4** (`[ ]`): QA visual contra `Panel Admin Rediseño.dc.html` en escritorio y móvil, claro y
  oscuro. El propio spec advierte que varias pantallas solo se verificaron con `lint`/`build`.

### E10 · Responsive + guard de cambios sin guardar — Hecho

- **Objetivo:** que ninguna pantalla del panel ni del sitio público desborde a 375/768/1024/1440 px, y que no se
  pierda texto escrito en un formulario por un clic fuera del panel.
- **Alcance:** `min-w-0` en la columna de contenido de `AdminLayout`, paddings y footers que envuelven, drawers de
  tickets y venta, grilla de Glide con scroll propio; guard compartido (`useUnsavedGuard`,
  `DiscardChangesDialog`, props `dismissible` e `isDirty` en `Modal`) aplicado a todas las superposiciones.
- **Criterios:** sin scroll horizontal a nivel de página en 9 rutas × 4 anchos (36 cargas autenticadas); los
  modales de formulario no cierran con clic en el fondo y piden confirmación si hay cambios; los overlays de
  solo lectura sí cierran con clic en el fondo.
- **Evidencia:** `3dee709` ("panel responsive, aviso de cambios sin guardar y espaciado del catálogo"). QA de
  R3: 36 cargas sin desborde; correcciones encontradas y aplicadas (drawer del ticket, `min-w-0` en la nota).
- **Abierto:** nada registrado. La clasificación de 13 overlays (formulario vs solo lectura) está tabulada en el
  spec.

### E11 · SEO: tres tandas — En curso (código hecho, verificación y decisiones abiertas)

- **Objetivo:** pasar de una SPA sin contenido inicial a un sitio prerenderizado, con precios y garantía
  coherentes y titles orientados a clic.
- **Alcance por tanda:**
  1. [seo-arreglos.md](odd/tasks/seo-arreglos.md) (2026-10-08): NAP del schema, `noindex` en 404, `og:image`
     absoluta, `/redes` con title/description/canonical/H1, medición con PageSpeed y Search Console.
  2. [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md) (2026-10-08/09): dirección 1873,
     `/garantia`, páginas de servicio de 600–1.000 palabras, página de zona San Borja, imágenes redimensionadas
     (1,7 MB → 112 KB, 1,4 MB → 127 KB, 372 KB → 96 KB), prerender de 13 rutas, 301 de `/prices` y `/p/precios`,
     unificación de horario/tiempos/garantía.
  3. [seo-ctr-precios.md](odd/tasks/seo-ctr-precios.md) (2026-10-09): `pricingData.js` como única fuente de
     montos, precios "desde" consistentes, política de adelanto, títulos con cifras.
- **Criterios reales:** ningún archivo público (fuera de tickets) contiene "1859"; cada página de servicio tiene
  600–1.000 palabras; `dist/` trae 13 rutas con un solo `title`, `description`, `canonical` y H1; cambiar un monto
  en `pricingData.js` actualiza Home, carrusel, `/precios`, servicios, FAQ, titles y JSON-LD; `/prices` y
  `/p/precios` redirigen con 301.
- **Evidencia:** `e2ad557` informe de competencia y planes SEO, `f1f9564` páginas de privacidad, garantía y zona
  San Borja, `9372eca` prerender. Base de la investigación en
  [reports/Competencia reparación celulares Lima.md](<reports/Competencia reparación celulares Lima.md>) y
  `research_notes/`.
- **Abierto:** H3 del spec (noindex de `/app-shell`, año del pie calculado en render, `fetchPriority`, `Location.jsx`
  muerto, `@import` de Plus Jakarta en todas las páginas), H2 (comprobar 301 y prerender **después** del deploy y
  pedir indexación en Search Console, acción del dueño) y las decisiones 1–5 de precios del §"Decisiones abiertas"
  de `seo-ctr-precios.md`.

### E12 · Migración SQLite → Mongo — Hecho parcial (por decisión)

- **Objetivo:** que los datos del escritorio no se pierdan al pasar a la web.
- **Alcance real:** `backend/scripts/migrate-sqlite.ts`, idempotente por clave natural, con `--dry-run`/`--help`,
  que hoy importa **solo** `cierre_dia` a `cashClosingRows`. El inventario no se migra: el spec de inventario v2
  lo declara fuera de alcance porque los datos actuales son de prueba y el modelo cambió por completo
  (marcas/modelos/repuestos → productos con compatibilidad).
- **Criterios:** re-ejecutar no duplica filas; el dry-run informa conteos.
- **Evidencia:** `9e8d359` (script) y el import del propio archivo, que solo referencia
  `CashClosingRowSchema`.
- **Abierto:** [ADR 0008](docs/adrs/0008-migracion-de-inventario-desde-sqlite.md) sigue describiendo la migración
  de marcas/modelos/repuestos y no recoge la decisión del 2026-09-25 que la anuló (deuda de documentación, §6).

### E13 · QA 2026-09-26 y correcciones — Hecho salvo lo "No verificado"

- **Objetivo:** corregir el QA manual del panel completo, que encontró 18 hallazgos (4 críticos).
- **Estado por hallazgo (verificado en código):** el proxy ya cubre `technicians`, `cobros`, `sales`, `events` y
  `webhooks` en las tres listas (`vercel.ts`, `vite.config.js`, `nginx`); la bandeja lee la lista (`useTickets`
  acepta `items` y `tickets`, porque el endpoint devuelve `{ ok, tickets, … }`) y el listado ya no expone
  `claveEquipo`; crear un ticket crea o recupera el cliente (`registerClient` en `ticket.use-cases.ts`); el
  detalle calcula el saldo en el servidor y muestra "Saldo cancelado" al entregar; el comprobante genera un QR
  real (vía `api.qrserver.com`) y mostraba la dirección de San Borja con el número 1859, ya corregida a
  1849-1851 (P1-3, cerrado el 2026-10-25); la
  bandeja tiene pestañas Pendiente/Aprobado/Abandonado y el PIN usa `inputMode="numeric"`.
- **Evidencia:** `8f95293` + `43dc6b2` ("correcciones qa"), `7134248`, `612e8ca`, `961b5c6`, `26b31b0`.
- **Abierto (del §"No verificado" del spec):** cobros creados, anular cobro y aprobación sin stock **no tienen
  verificación en navegador registrada** (sí tests automatizados para el `409`). La "vista celular" sí quedó
  cubierta después por E10 (36 cargas a 375/768/1024/1440 px).

### E14 · Despliegue (Vercel, Dokploy, CI) — En curso

- **Objetivo:** que el sitio y el panel corran en producción y que cada cambio se valide antes de desplegarse.
- **Alcance:** `frontend/vercel.ts` con prefijos de API y `cleanUrls`/301, Dockerfiles de frontend y backend,
  nginx con proxy SSE y `try_files` a `app-shell`, CI con tres jobs (backend, frontend, Playwright).
- **Evidencia:** `6a8e754` Dockerfiles, `f1a1256` `BACKEND_URL` desde entorno, `2684c1c` reenvío de `/api/events`,
  `ff32c9d` `rawBody` para el webhook de Kapso. El workflow `.github/workflows/ci.yml` y la suite `e2e/`
  (2 specs de Playwright, 11 tests) **existen en el árbol pero no están commiteados** al corte.
- **Abierto:** commit del estado actual (lo decide el dueño), verificación post-deploy de 301/`app-shell`/nginx, y
  decidir el destino real: Vercel no mantiene la conexión SSE abierta (ADR 0028) y el webhook de Kapso se ajustó
  para el arranque de Dokploy (`ff32c9d`), así que conviven dos configuraciones de despliegue.

## 5. Backlog abierto

Sale de los pendientes reales: los "PENDIENTE" de [TECH-DESIGN.md](TECH-DESIGN.md), los "No verificado" de
[qa-2026-09-26.md](odd/tasks/qa-2026-09-26.md), las tareas sin marcar de los 14 specs y la deuda que se ve en el
código. Tamaño: S ≤ media jornada, M ≤ 2 jornadas, L > 2 jornadas.

| # | Item | Por qué importa | Spec / ADR | Tamaño |
|---|---|---|---|---|
| P1-1 | Cerrar la QA de WhatsApp con **envío real** a Kapso y confirmar el índice `1` del botón URL | Cada plantilla entregada se cobra y un índice equivocado rompe el enlace "Ver detalle" del cliente | [integracion-plantillas-whatsapp.md](odd/tasks/integracion-plantillas-whatsapp.md) T5 `[~]` · [ADR 0029](docs/adrs/0029-plantillas-whatsapp-via-kapso.md) | M |
| P1-2 | Cambiar la garantía impresa de **30 días a 3 meses** | El comprobante que se entrega dice un plazo distinto al publicado en todo el sitio | `TicketDetailDrawer.jsx:1188` · [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md) H1b | S |
| P1-3 | ~~Actualizar la dirección en la página pública del ticket y el comprobante~~ **Cerrado (2026-10-25)**: el dueño fijó la dirección correcta y se unificó todo el producto en **Av. San Luis 1849-1851** (antes convivían 1859 y 1873) | Es el NAP que lee el cliente | [seguridad-hardening-2026-10-25.md](odd/tasks/seguridad-hardening-2026-10-25.md) C8 | S |
| P1-4 | QA visual del rediseño (R4) en escritorio/móvil y claro/oscuro | Varias pantallas se validaron solo con `lint`/`build`; el diseño es la fuente de verdad visual | [rediseno-panel.md](odd/tasks/rediseno-panel.md) R4 `[ ]` | M |
| P1-5 | Prueba de tiempo real con dos pestañas (T4) y confirmar que el panel corre sobre nginx/Dokploy | En Vercel el SSE no se sostiene; sin esta prueba el "tiempo real" no está demostrado | [realtime-panel.md](odd/tasks/realtime-panel.md) T4 `[ ]` · [ADR 0028](docs/adrs/0028-tiempo-real-sse-invalidacion.md) | S |
| P1-6 | Commitear y desplegar el estado actual (`e2e/`, `.github/`, `docs/`, `PRD.md`, `TECH-DESIGN.md`, `BACKLOG.md`) | La suite Playwright y el CI existen pero no están versionados, así que no protegen nada | [CLAUDE.md](CLAUDE.md) §1 y §7 | S |
| P1-7 | Verificar en navegador **anular cobro** y **aprobar sin stock** | Son los dos caminos de dinero/stock que quedaron en "No verificado" | [qa-2026-09-26.md](odd/tasks/qa-2026-09-26.md) §No verificado | S |
| P2-1 | `noindex` para `/app-shell` en `vercel.ts` (headers) y en nginx | Hoy el shell del SPA es accesible con el title genérico; puede competir en el índice | [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md) H3 | S |
| P2-2 | Calcular el año del pie **después** del montaje | El HTML prerenderizado congela el año; el 1 de enero provoca mismatch de hidratación en todas las páginas | `Footer.jsx:112` · H3 | S |
| P2-3 | Implementar el automatismo de **abandono 7/15 días** | [ADR 0007](docs/adrs/0007-estados-del-ticket.md) lo promete y no existe scheduler; hoy el estado es manual | [ADR 0007](docs/adrs/0007-estados-del-ticket.md) · [TECH-DESIGN.md](TECH-DESIGN.md) riesgos | M |
| P2-4 | Crear en Meta las 3 plantillas de marketing y decidir coexistencia o migración del número | Sin plantillas aprobadas no hay campañas ni recompensa por WhatsApp | [plantillas-whatsapp.md](odd/tasks/plantillas-whatsapp.md) · [envio-tickets-whatsapp.md](odd/tasks/envio-tickets-whatsapp.md) §Decisiones | M |
| P2-5 | Crear la ruta `/resena` (redirección a Google) | Los ADR 0026/0027 la usan como destino del pedido de reseña y no existe | [ADR 0026](docs/adrs/0026-bot-whatsapp-ventana-24h-y-resena.md), [ADR 0027](docs/adrs/0027-mensajes-rapidos-desde-el-panel.md) | S |
| P2-6 | Centralizar el número del negocio (hoy **28 apariciones en 23 archivos** y dos formatos de enlace) | Cambiar el número obliga a editar 23 archivos y ya hay dos formatos conviviendo | `frontend/src/**` · [envio-tickets-whatsapp.md](odd/tasks/envio-tickets-whatsapp.md) idea 11 | M |
| P2-7 | Generar el QR del comprobante localmente en vez de `api.qrserver.com` | Sin internet no se imprime y la URL de seguimiento viaja a un tercero | `TicketDetailDrawer.jsx:1194` · idea 6 | S |
| P2-8 | Cerrar las decisiones de precio 1–5 de la tanda 3 | Quedan lecturas del "desde" sin confirmar por el dueño (pantalla OLED, estándar/OEM, tarjetas de la Home) | [seo-ctr-precios.md](odd/tasks/seo-ctr-precios.md) §Decisiones abiertas | M |
| P2-9 | Publicar Libro de Reclamaciones, RUC y razón social | Riesgo legal señalado por el informe de competencia y señal de confianza frente a cadenas | [reports/Competencia reparación celulares Lima.md](<reports/Competencia reparación celulares Lima.md>) fila 7 · H4 | M |
| P2-10 | Corregir los riesgos del TECH-DESIGN y los ADR que quedaron atrás (0007, 0008, 0026/0027) | El documento de arquitectura describe pendientes ya resueltos y omite decisiones tomadas | [TECH-DESIGN.md](TECH-DESIGN.md) §Riesgos · [ADR 0008](docs/adrs/0008-migracion-de-inventario-desde-sqlite.md) | M |
| P2-11 | Throttler: `trust proxy` y almacenamiento compartido | Detrás del rewrite de Vercel todos los clientes pueden compartir IP y el límite es por instancia | [inventario-v2.md](odd/tasks/inventario-v2.md) §Next step | S |
| P2-12 | Decidir el borrado duro de un producto cuyos únicos movimientos son "Stock inicial" y limpiar los datos de prueba QA | Hoy la marca/celular de prueba no se puede borrar porque un producto archivado los referencia (409 por diseño) | [inventario-v2.md](odd/tasks/inventario-v2.md) T3 | S |
| P3-1 | Tabla de precios por modelo, tipo de repuesto, tiempo y garantía | Requiere precios reales del dueño; es la mejora de CTR de mayor impacto potencial | Informe fila 5 · [seo-ctr-precios.md](odd/tasks/seo-ctr-precios.md) fuera de alcance | M |
| P3-2 | Guías de síntomas y páginas por modelo | Solo con datos confirmados y ya con prerender funcionando | Informe filas 17–18 · H3 | L |
| P3-3 | Eliminar `Location.jsx` (componente muerto) | Ningún archivo lo importa; duplica el bloque de dirección | `frontend/src/Components/Location.jsx` · H3 | S |
| P3-4 | `fetchPriority` en `Hero.jsx` y `@import` de Plus Jakarta en `redes.css` | Advertencia de React 18 y una fuente cargada en todas las páginas | `Hero.jsx:60`, `Components/Redes/redes.css` · H3 | S |
| P3-5 | Sacar los date pickers del barrel `shared/ui/index.js` | `react-day-picker` + `date-fns` entran en el chunk eager del panel | [panel-inventario-historial.md](odd/tasks/panel-inventario-historial.md) T16 (desviación) | S |
| P3-6 | Pasada de hidratación en navegador (cerrar H1 al 100 %) | T9 se verificó de forma estática; falta abrir cada ruta y confirmar que no hay errores de React | [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md) H1 paso 4 | S |
| P3-7 | Verificación post-deploy: 301, `/app-shell`, nginx y PageSpeed | Toda la configuración de servidor se validó en local, no en producción | H2 | S |
| P3-8 | Decidir el futuro de `frontend/api/contact.js` (Telegram + nodemailer) | Convive con el backend NestJS y mantiene un segundo destino de contacto | `frontend/api/contact.js` | S |

**Total abierto: 27 items** (7 en P1, 12 en P2, 8 en P3). Ninguno es una feature nueva: todos son cierre,
verificación o coherencia de algo ya decidido en un spec o un ADR.

## 6. Deuda técnica conocida

| Deuda | Dónde | Por qué está | Impacto |
|---|---|---|---|
| Tres listas de prefijos `/api/*` duplicadas | `frontend/vercel.ts`, `frontend/vite.config.js`, `frontend/nginx/default.conf.template` | No hay import compartido entre configs de build distintos | Si se agrega un módulo y se olvida una lista, la ruta devuelve el HTML del SPA con 200 y la feature "no funciona" sin error de red (ya pasó con `technicians`, `cobros`, `sales`) |
| Dos servidores de contacto | `frontend/api/contact.js` (Telegram + nodemailer) y `backend/` | El formulario de contacto es anterior al backend | Dos destinos, dos configuraciones de secretos, dos formas de fallar |
| Número del negocio hardcodeado 28 veces en 23 archivos y en dos formatos (`api.whatsapp.com/send` y `wa.me`) | `frontend/src/**` | Crecimiento por copia entre componentes | Cambiar el número es una edición masiva con riesgo de dejar enlaces rotos |
| `ADR 0007` describe **5 estados**; el código usa **7** (+`aprobado`, +`cancelado`) | `docs/adrs/0007-estados-del-ticket.md` vs `backend/src/tickets/domain/ticket.entity.ts` | La ampliación se anotó en [ADR 0025](docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md) (act. 2026-09-25) sin actualizar 0007 | Quien lea solo el 0007 modela mal el flujo |
| `ADR 0008` describe la migración de inventario que ya no ocurre | `docs/adrs/0008-...md` | El script pasó a migrar solo `cierre_dia` tras inventario v2 | Documento y script dicen cosas distintas |
| `ADR 0026` y `0027` siguen en estado "Propuesto" aunque 0029 reemplaza su mensajería saliente | `docs/adrs/0026-...md`, `0027-...md` | Se decidió Kapso sin cambiar el estado de los anteriores | Ambigüedad sobre qué decisión rige hoy |
| "Riesgos técnicos abiertos" del TECH-DESIGN desactualizado | `TECH-DESIGN.md` §Riesgos | Varios riesgos ya se resolvieron (recuperación de enlace por teléfono vía `POST /api/tickets/public/lookup`, consentimiento/BAJA vía Kapso, plantillas aprobadas) y siguen listados | El riesgo real (abandono 7/15 sin automatizar, backups) queda escondido entre los resueltos |
| Glide Data Grid pesa ~105 kB gzip en el chunk del Historial | `frontend/src/admin/cash-closings/` | Se eligió por licencia MIT frente a AG Grid/Handsontable | Es el chunk más pesado del panel; no afecta al sitio público |
| Barrel `shared/ui/index.js` arrastra los date pickers | `frontend/src/admin/shared/ui/index.js` | Se re-exportó todo desde un solo archivo | `react-day-picker` + `date-fns` entran en el chunk eager del panel |
| Throttler en memoria y por `req.ip` | `backend/src/app.module.ts` | Configuración mínima del guard global | Límite por instancia y posible IP compartida detrás del proxy |
| `GET /api/tickets` usa un envelope híbrido (`{ ok, tickets, … }` en vez de `{ ok, data }`) | `backend/src/tickets/infrastructure/tickets.controller.ts` y `frontend/src/admin/tickets/hooks/useTickets.js` | Se corrigió el nombre del campo de la lista sin cambiar la forma del envelope | El frontend tolera dos formas (`data.items ?? data.tickets`), la clase de compatibilidad que termina ocultando una regresión |

## 7. Trazabilidad

La cadena que el repo usa de facto (y que [CLAUDE.md](CLAUDE.md) §2 formaliza) es
`PRD.md → docs/adrs/ → TECH-DESIGN.md → odd/tasks/<feature>.md → commits → verificación (tests / QA)`.

Cada eslabón responde al anterior: el PRD fija el alcance, el ADR decide, el TECH-DESIGN deriva criterios de
aceptación, el spec los convierte en tareas con contrato de API, y el commit lleva el hash que el spec cita como
evidencia.

**Cadenas completas de ejemplo:**

| PRD | ADR | TECH-DESIGN / spec | Commits | Verificación |
|---|---|---|---|---|
| "Enlace público único por ticket… identificador no adivinable" (§Alcance, §Casos borde) | [ADR 0006](docs/adrs/0006-modelo-de-datos-tickets-e-inventario.md) (`publicToken` UUID) + [ADR 0007](docs/adrs/0007-estados-del-ticket.md) | "Flujo: seguimiento público del cliente" · [modulo-tickets.md](odd/tasks/modulo-tickets.md) T1.3 | `8f95293`, `612e8ca`, `961b5c6` | `e2e/tests/public-ticket-tracking.spec.ts` (Playwright) + e2e de tickets en `backend/test/` |
| "Gestión de inventario (crear/editar/eliminar marcas, modelos y repuestos)" | [ADR 0006](docs/adrs/0006-modelo-de-datos-tickets-e-inventario.md) §Actualización 2026-09-25 (productos + Kardex) | [inventario-v2.md](odd/tasks/inventario-v2.md) §API contract y §Acceptance criteria | `d13684f`, `4fcf5f7`, `103921e` | `product.use-cases.spec.ts`, `inventory.e2e-spec.ts` y pasada de navegador T3 |
| "No incluye pagos en línea — el cobro se sigue haciendo en persona (efectivo/Yape)" | [ADR 0025](docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md) (cobros en colección aparte, anulación sin borrado) | [modulo-tickets.md](odd/tasks/modulo-tickets.md) C1/C3 + D1/D2 | `8f95293`, `7134248`, `43dc6b2` | `cobro.service.spec.ts`, `sales.service.spec.ts`; QA C4 en navegador |
| "Actualización 2026-09-23: el panel admite varios usuarios con dos roles fijos" (§No alcance) | [ADR 0021](docs/adrs/0021-autenticacion-jwt-en-cookie.md), [0022](docs/adrs/0022-usuarios-y-roles-fijos.md), [0023](docs/adrs/0023-seccion-personal.md), [0024](docs/adrs/0024-seccion-cuenta.md) | TECH-DESIGN "Flujo: autenticación", "sección Personal", "sección Cuenta" | `10bc3f9`, `d85c72d`, `291d386` | Criterios por flujo de TECH-DESIGN + `security.e2e-spec.ts` (30/30) |
| (Sin PRD: lo origina la investigación) — informe de competencia, fila 6 y 9 | — (no hay ADR de SEO) | [seo-mejoras-competencia.md](odd/tasks/seo-mejoras-competencia.md) T2–T9 | `f1f9564`, `9372eca`, `e2ad557` | Build con 13 rutas prerenderizadas, `dist/*.html` y barrido de texto prohibido |
| "No incluye notificaciones automáticas por WhatsApp" (§No alcance) → cambio posterior del dueño | [ADR 0016](docs/adrs/0016-integracion-n8n-meta-whatsapp.md) → [0026](docs/adrs/0026-bot-whatsapp-ventana-24h-y-resena.md) → [0029](docs/adrs/0029-plantillas-whatsapp-via-kapso.md) | [integracion-plantillas-whatsapp.md](odd/tasks/integracion-plantillas-whatsapp.md) §Contrato | `abb3947`, `97ce6d6`, `ff32c9d` | Checks de T5 (28 suites/226 unitarios, 9 suites/74 e2e) — **QA real pendiente** |

**Dónde se rompe la cadena (verificable):**

1. **El PRD no se actualizó cuando cambió el alcance.** Su §No alcance dice que no hay notificaciones por
   WhatsApp, y hoy hay envío de plantillas desde el panel (E8); también promete migrar la jerarquía
   marcas→modelos→repuestos, y esa jerarquía fue reemplazada por el catálogo v2 **sin migración** (E2/E12).
   Las dos decisiones están documentadas en ADR, no en el PRD.
2. **No hay ADR de SEO.** Las tres tandas se apoyan en el informe de competencia, en los specs y en
   `pricingData.js`, no en una decisión de arquitectura registrada.
3. **El TECH-DESIGN quedó congelado en "panel + community"**: describe tickets y comunidad como `NUEVO`, no
   recoge inventario v2, WhatsApp por Kapso ni tiempo real, y su tabla de ADR se detiene en 0024.

## 8. Convenciones de trabajo usadas

| Convención | Cómo se ve en el repo |
|---|---|
| **No commitear sin pedido explícito** | [CLAUDE.md](CLAUDE.md) §1 (y copia en `.claude/CLAUDE.md`); repetido en los 14 specs ("NUNCA ejecutar `git commit` ni `git push`… aplica a todos los subagentes"). Consecuencia al corte: `e2e/`, `.github/` y `CLAUDE.md` sin seguimiento, y los ADR reubicados sin commitear |
| **Conventional Commits** | La serie disciplinada arranca el 2026-09-23: `feat(backend)`, `fix(frontend)`, `docs(adr)`, `build(seo)`, `chore:`, `test:`. Sin `Co-Authored-By` ni atribución a IA. Hay commits antiguos que no cumplen (`103921e Muchos cambis`, `0d07e93 ACTUALIZACION`, `d8a55da antes del ticket`) |
| **Rama de trabajo** | `cambiosNuevos` es la rama actual; tres merges de worktrees de agentes (`5ab6c40`, `8ff30ea`, `bb550dd`) con `.claude/worktrees/` ignorado en `.gitignore` |
| **Orquestación con subagentes** | `.claude/skills/orquestador-armalytech/SKILL.md`; los specs marcan cada tarea con `Route: delegated` o `Route: inline` y separan fases con carpetas disjuntas para evitar colisiones |
| **Contrato antes que código** | En los specs de tickets y WhatsApp el contrato de API (campos, códigos de error, formas de respuesta) se escribe antes de delegar; los agentes frontend trabajan contra ese contrato en paralelo |
| **TDD desactivado, checks obligatorios** | Los 14 specs repiten `TDD: Mode off` y enumeran los checks: backend `build`/`test`/`test:e2e`/`eslint` sin `--fix`; frontend `lint`/`build`; QA visual del orquestador |
| **Código en inglés, UI en español** | Declarado en los specs y en CLAUDE.md §5; los identificadores del backend y los comentarios están en inglés y los textos de pantalla en español |
| **Arquitectura limpia por feature** | `backend/src/<feature>/{domain,application,infrastructure}` ([ADR 0020](docs/adrs/0020-arquitectura-limpia-por-feature.md)); `frontend/src/admin/<feature>/{api,hooks,components}`. Ningún componente llama a `fetch` directamente |
| **Una sola traducción de errores a HTTP** | `backend/src/shared/infrastructure/http-exception.filter.ts`; los casos de uso lanzan errores de dominio |
| **El dinero se calcula en el servidor** | ADR 0025 y CLAUDE.md §5: al entregar, el cliente manda solo el método de pago |
| **Evidencia obligatoria por tarea** | Cada spec cierra con una sección "Evidencia"/"Progress" que cita hash de commit, conteo de tests y resultado de lint/build; este BACKLOG se construyó leyendo esas secciones y verificando el código cuando el spec y el árbol no coincidían |
