# Integración de plantillas de WhatsApp (Kapso) en tickets

## Objetivo
Enviar desde el panel las plantillas aprobadas por Meta (`ticket_listo`, `resena_google`) al
cliente del ticket, con un botón primero y un envío automático opcional al pasar a `listo`
(apagado por defecto), y recibir de vuelta los estados de entrega, las bajas de marketing y la hora
del último mensaje del cliente (ventana de 24 h).

## Problema / por qué
- Hoy el panel solo abre `wa.me` con texto libre; nadie sabe si al cliente se le avisó.
- El número +51 924 548 268 ya está conectado a la Cloud API en **coexistencia** mediante Kapso
  (verificado el 2026-10-10: health check "Healthy", webhook verificado, plantillas aprobadas y
  sincronizadas, envío de prueba recibido).
- Sin registro de envíos, un ticket que vuelve a `listo` dispararía avisos duplicados (y cobrados).

## Alcance
- Fase 1: adaptador Kapso, registro de envíos, endpoints, botones en el detalle del ticket, envío
  automático de `ticket_listo` detrás de `WHATSAPP_AUTO_TICKET_LISTO` (apagado).
- Fase 2: webhook entrante de Kapso con firma HMAC: estados de entrega, bajas de marketing,
  `lastInboundAt` por número.
- Fuera de alcance: bot conversacional, migrar plantillas nuevas (las de Utilidad restantes se
  crean en Meta cuando el dueño las apruebe), ruta `/resena`.

## Restricciones
- No commit / push (regla del proyecto). Los cambios quedan en el árbol de trabajo.
- Código en inglés, textos de UI en español.
- TDD: off (configuración del proyecto, ver `modulo-tickets.md`). Checks funcionales obligatorios.
- Nunca leer `.env`. Variables nuevas solo documentadas en `.env.example` / README.
- El envío no puede bloquear ni revertir un cambio de estado del ticket.

## Decisiones (orquestador, 2026-10-10)
1. **Kapso directo desde NestJS**, sin n8n (el bot de n8n se retira). Queda en ADR 0029, que
   reemplaza la parte de mensajería de ADR 0016 y el punto 1 de ADR 0026.
2. **Módulo genérico `backend/src/whatsapp/`** (no conoce tickets): puerto de envío, registro de
   mensajes, contactos (ventana 24 h y bajas) y webhook. La lógica de tickets vive en
   `backend/src/tickets/application/ticket-whatsapp.service.ts`. `TicketsModule` importa
   `WhatsappModule`; no hay import circular.
3. **Una vez por ticket y plantilla**: se rechaza un segundo envío con `409` salvo `force: true`
   (el panel pide confirmación antes de reenviar).
4. **`resena_google` (Marketing)** solo si el ticket está `entregado`, el cliente existe con
   `marketingConsent === true` y el número no tiene baja registrada.
5. **`ticket_listo` (Utilidad)** solo si el ticket está `listo`; no exige consentimiento.
6. **Sin credenciales** (`KAPSO_API_KEY` o `KAPSO_PHONE_NUMBER_ID` vacíos) se usa un adaptador
   `Noop` que falla con `503 whatsapp_not_configured`; el resto del backend arranca normal.
7. Baja: el botón de respuesta rápida "Dejar de recibir promociones" (o el texto `BAJA`) registra
   `marketingOptOutAt` en el contacto y pone `marketingConsent=false` en el cliente si existe.

## Contrato

### Variables de entorno (todas opcionales)
| Variable | Default | Uso |
|---|---|---|
| `KAPSO_API_KEY` | — | Header `X-API-Key` |
| `KAPSO_PHONE_NUMBER_ID` | — | `961761267022319` (número Armaly Tech) |
| `KAPSO_API_BASE_URL` | `https://api.kapso.ai/meta/whatsapp/v24.0` | Base del proxy de Meta |
| `KAPSO_WEBHOOK_SECRET` | — | HMAC-SHA256 del webhook; sin él, el webhook responde 503 |
| `PUBLIC_SITE_URL` | `https://www.armalytech.com` | Solo informativo en logs/respuestas |
| `WHATSAPP_AUTO_TICKET_LISTO` | `false` | `true` = envía `ticket_listo` al pasar a `listo` |

### Envío a Kapso
`POST {KAPSO_API_BASE_URL}/{KAPSO_PHONE_NUMBER_ID}/messages`, header `X-API-Key`, timeout 10 s.
Respuesta esperada: `{ messages: [{ id: "wamid..." }] }`.

`ticket_listo` (idioma `es`):
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "51XXXXXXXXX",
  "type": "template",
  "template": {
    "name": "ticket_listo",
    "language": { "code": "es" },
    "components": [
      { "type": "body", "parameters": [
        { "type": "text", "text": "<nombre>" },
        { "type": "text", "text": "<equipo>" },
        { "type": "text", "text": "<codigo>" } ] },
      { "type": "button", "sub_type": "url", "index": "1",
        "parameters": [ { "type": "text", "text": "<publicToken>" } ] }
    ]
  }
}
```
- `<nombre>` = `cliente.nombre` (primer nombre); `<equipo>` = `marca modelo` recortado, o
  `equipo` si ambos faltan; `<codigo>` = `ticket.codigo`.
- Parámetros saneados: sin saltos de línea ni tabs, sin 4+ espacios seguidos, no vacíos.
- Índice del botón URL = `1` (orden en Meta: respuesta rápida, Ver detalle, Cómo llegar). Se
  confirma en la QA con un envío real.

`resena_google` (idioma `es`): solo componente `body` con `[{ type: "text", text: "<nombre>" }]`.

Teléfono destino: `PhoneNumber.of(ticket.cliente.telefono).toE164()` (`51` + 9 dígitos, sin `+`).
Si no es válido → `422 invalid_phone`.

### Colección `whatsapp_messages`
`{ id, ticketId?, clientId?, template, to, wamid?, status: 'sent'|'delivered'|'read'|'failed',
  error?: { code, title, message }, insideServiceWindow: boolean, trigger: 'manual'|'auto',
  sentById?, sentByEmail?, sentAt, statusAt, createdAt }`.
Índices: `wamid` (único, sparse), `{ ticketId, template }`.
Si Kapso responde error, se guarda igual con `status: 'failed'` y el error, y la API responde
`502 whatsapp_send_failed` con el mensaje de Kapso.

### Colección `whatsapp_contacts`
`{ phoneE164 (único), lastInboundAt?, marketingOptOutAt?, updatedAt }`.

### Endpoints (sesión requerida, mismos roles que `PATCH /tickets/:id/status`)
- `GET /api/tickets/:id/whatsapp` → `200 { items: WhatsAppMessageDto[], window: { open: boolean,
  lastInboundAt: string|null }, marketing: { allowed: boolean, reason?: 'no_client'|'no_consent'|'opted_out' } }`.
- `POST /api/tickets/:id/whatsapp` body `{ template: 'ticket_listo'|'resena_google', force?: boolean }`
  → `201 WhatsAppMessageDto`.
  Errores (`{ statusCode, message, error }`, `message` = código):
  `409 invalid_state` (estado no corresponde), `409 already_sent` (ya enviada sin `force`),
  `403 marketing_not_allowed`, `422 invalid_phone`, `502 whatsapp_send_failed`,
  `503 whatsapp_not_configured`.

`WhatsAppMessageDto` = `{ id, template, to, status, error?, insideServiceWindow, trigger,
  sentByEmail?, sentAt, statusAt }` (fechas ISO).

### Webhook entrante (fase 2)
`POST /api/webhooks/kapso` (`@Public()`, sin throttle estricto).
- Verifica `X-Webhook-Signature` = HMAC-SHA256 hex del **cuerpo crudo** con
  `KAPSO_WEBHOOK_SECRET`, comparación `timingSafeEqual`. Inválida → `401`. Sin secreto → `503`.
- Requiere `rawBody: true` en `create-nest-app.ts`.
- Lote: si `X-Webhook-Batch: true` o `body.batch === true`, procesa cada item de `body.data`.
- Idempotencia: ignora `X-Idempotency-Key` repetidos (colección `whatsapp_webhook_events` con TTL 7
  días, o índice único).
- Evento por `X-Webhook-Event`:
  - `whatsapp.message.received`: `from = message.from ?? conversation.phone_number`; actualiza
    `lastInboundAt`. Baja si `message.button.text`/`message.button.payload`,
    `message.interactive.button_reply.title` o `message.text.body` (normalizado) es
    "dejar de recibir promociones" o "baja".
  - `whatsapp.message.sent|delivered|read|failed`: busca por `message.id` (wamid) y actualiza
    `status`, `statusAt` y `error` (`message.kapso.statuses[n].errors[0]`). No retrocede de `read`
    a `delivered`.
- Responde siempre `200 { ok: true }` en < 10 s si la firma es válida (aunque el evento se ignore).

### Panel (detalle del ticket)
Sección **"WhatsApp"** en `TicketDetailDrawer`:
- `listo` → botón **"Avisar que está listo"**; `entregado` → botón **"Pedir reseña"** (deshabilitado
  con motivo si `marketing.allowed` es `false`: "Sin consentimiento de marketing", "El cliente se
  dio de baja", "Ticket sin cliente registrado").
- Si ya se envió esa plantilla → el botón dice **"Reenviar"** y abre una confirmación ("Ya se envió
  el {fecha}. Cada envío se cobra. ¿Reenviar?") que manda `force: true`.
- Lista de envíos: plantilla, fecha, quién, estado (Enviado · Entregado · Leído · Falló + motivo).
- Indicador de ventana: "Ventana de 24 h abierta" cuando `window.open`.
- Errores → toast con texto en español por código.
- El botón `wa.me` existente se mantiene como "Abrir chat" (respaldo manual) y deja de anteponer
  `51` a ciegas si el número ya lo trae.

## Tareas
| ID | Tarea | Ruta | Dueño | Depende |
|---|---|---|---|---|
| T1 | Backend fase 1: módulo `whatsapp`, adaptador Kapso + Noop, `whatsapp_messages`, `TicketWhatsAppService`, endpoints, auto `listo` con flag, env validation, tests | delegado (escritor backend) | `backend/**` | — |
| T2 | Backend fase 2: webhook Kapso, firma, lotes, idempotencia, estados, bajas, `whatsapp_contacts`, tests | delegado (mismo escritor, después de T1) | `backend/**` | T1 |
| T3 | Frontend: API client, hooks, sección WhatsApp en el drawer, confirmación de reenvío | delegado (escritor frontend) | `frontend/src/admin/tickets/**` | contrato |
| T4 | ADR 0029 + README/.env.example | inline (orquestador) | `frontend/adrs/`, docs | — |
| T5 | QA: checks completos, lectura de diffs, prueba en navegador | orquestador | — | T1–T3 |

- [x] T1 — delegado. Módulo `backend/src/whatsapp/` (puerto, Kapso, Noop, 3 esquemas, repos),
  `tickets/application/ticket-whatsapp.service.ts`, `GET/POST /tickets/:id/whatsapp` (throttle 30/min),
  envío automático en `updateStatus` detrás de `WHATSAPP_AUTO_TICKET_LISTO`, `env.validation.ts`.
  `TICKET_REPOSITORY` se movió a `tickets/domain/ticket.repository.port.ts` (re-exportado).
  Decisiones del escritor aceptadas: un envío `failed` no cuenta como enviado (reintento sin
  `force`); el envío automático se espera (Vercel congela promesas sueltas), timeout 10 s.
- [x] T2 — delegado. `POST /api/webhooks/kapso` (`@Public`, `@SkipThrottle`), firma HMAC del cuerpo
  crudo (`rawBody: true` en `create-nest-app.ts`), lotes, idempotencia con TTL 7 días, estados sin
  retroceso, bajas (texto exacto "dejar de recibir promociones" o "baja"), `lastInboundAt`.
- [x] T3 — delegado. Archivos: `api/ticketsApi.js`, `api/queryKeys.js`, `hooks/useTicketWhatsApp.js`
  (nuevo), `hooks/useTickets.js`, `components/TicketWhatsAppSection.jsx` (nuevo),
  `components/TicketDetailDrawer.jsx` (botón `wa.me` → "Abrir chat", sin `51` duplicado).
  Evidencia: `pnpm lint` sin errores (re-ejecutado por el orquestador); `vite build` OK (agente).
  Aclaración de contrato enviada al backend: errores con `{ message: código, code: código }` y
  `detail` en `whatsapp_send_failed` (el filtro global lo expone en `error.detail`).
- [x] T4 — `frontend/adrs/0029-plantillas-whatsapp-via-kapso.md` escrito (inline). `.env.example` lo
  completa el escritor backend.
- [~] T5 — checks automáticos re-ejecutados por el orquestador (2026-10-10):
  backend `pnpm build` OK · `eslint` sin salida · `pnpm test` 28 suites / 226 tests OK ·
  `pnpm test:e2e` 9 suites / 74 tests OK; frontend `pnpm lint` OK · `vite build` OK.
  Diffs leídos: `kapso-whatsapp-sender.ts`, `kapso-webhook-signature.ts`, hook en `updateStatus`.
  Hallazgo del orquestador: `/api/webhooks` no pasaba por el proxy de producción; se agregó
  `webhooks` a `nginx/default.conf.template`, `vercel.ts` y `vite.config.js`.
  **Pendiente:** QA en navegador y envío real (necesita sesión del dueño y las variables de Kapso
  en el servidor); confirmar índice `1` del botón URL; `.env.example` no editable por el agente
  (bloqueado por permisos), líneas entregadas al dueño.

## Checks
- backend: `pnpm build`, `pnpm exec eslint "{src,test}/**/*.ts"`, `pnpm test`, `pnpm test:e2e`
- frontend: `pnpm lint`, `pnpm exec vite build --outDir <temp> --emptyOutDir`

## Progreso y evidencia
- 2026-10-10: exploración del código (ver mapa en la conversación), contrato definido.

## Siguiente paso
Lanzar T1 y T3 en paralelo.
