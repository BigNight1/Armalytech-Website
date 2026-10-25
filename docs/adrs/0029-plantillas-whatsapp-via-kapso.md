# ADR 0029: Envío de plantillas de WhatsApp desde NestJS mediante Kapso

## Estado

Aceptado (2026-10-10). Reemplaza la parte de mensajería saliente de ADR 0016 y el punto 1 de
ADR 0026 (bot en n8n). Mantiene las reglas de cobro y de reseña de ADR 0026 y la idea de botones por
ticket de ADR 0027.

## Contexto

- El número del negocio (+51 924 548 268) se conectó a la Cloud API de Meta en **coexistencia**:
  sigue funcionando en la app WhatsApp Business del celular y, a la vez, recibe y envía por API.
  Meta solo permite la coexistencia a través de un Solution Partner o Tech Provider; se eligió
  **Kapso** (plan gratuito, sin recargo sobre el precio de Meta).
- Están aprobadas en Meta las plantillas `ticket_listo` (Utilidad) y `resena_google` (Marketing).
- El bot de n8n se retira (decisión del dueño, 2026-10-07), así que n8n ya no es el lugar natural
  para enviar mensajes.
- Cada plantilla entregada se cobra (Marketing siempre; Utilidad gratis solo dentro de la ventana
  de 24 h que abre el cliente al escribir).

## Decisión

1. **NestJS envía directo a Kapso** (`POST /meta/whatsapp/v24.0/{phone_number_id}/messages`, header
   `X-API-Key`), con el formato de plantillas de Meta. n8n queda fuera del flujo saliente.
2. **Módulo genérico `whatsapp`** con un puerto de envío (`WHATSAPP_SENDER`), un adaptador Kapso y
   un adaptador nulo cuando faltan credenciales. La lógica de tickets (`TicketWhatsAppService`) vive
   en el módulo de tickets.
3. **Registro de cada envío** en `whatsapp_messages` (plantilla, número, `wamid`, estado, quién lo
   envió, si fue manual o automático). Una plantilla se envía **una vez por ticket**; reenviar exige
   confirmación explícita (`force`).
4. **Botón primero:** el panel envía `ticket_listo` en `listo` y `resena_google` en `entregado`. El
   envío automático de `ticket_listo` existe detrás de `WHATSAPP_AUTO_TICKET_LISTO`, **apagado por
   defecto**. El envío nunca bloquea ni revierte el cambio de estado.
5. **Marketing solo con consentimiento** (ADR 0015) y sin baja registrada.
6. **Webhook entrante de Kapso** (`POST /api/webhooks/kapso`, firma HMAC-SHA256 del cuerpo crudo,
   idempotencia por `X-Idempotency-Key`): actualiza estados de entrega, registra `lastInboundAt` por
   número (ventana de 24 h) y procesa la baja "Dejar de recibir promociones".

## Alternativas consideradas

- **Seguir enviando por n8n (ADR 0016):** suma un salto, un servicio más que mantener y un webhook
  sin autenticación, justo cuando el bot se retira. Descartada.
- **Envío automático desde el primer día:** un cambio de estado accidental mandaría un mensaje
  cobrado al cliente. Se deja apagado hasta validar los avisos manuales.
- **Migrar el número a la Cloud API sin coexistencia:** gratis, pero el número deja de funcionar en
  el celular. Descartada por el dueño.
- **Hacerse Tech Provider propio:** exige App Review y verificación de acceso para un solo número.
  Descartada por costo/beneficio.

## Consecuencias

- Variables nuevas, todas opcionales: `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID`,
  `KAPSO_API_BASE_URL`, `KAPSO_WEBHOOK_SECRET`, `PUBLIC_SITE_URL`, `WHATSAPP_AUTO_TICKET_LISTO`.
  Sin credenciales, el backend arranca y el envío responde `503 whatsapp_not_configured`.
- Dependencia de un proveedor joven (Kapso). El puerto `WHATSAPP_SENDER` permite cambiar a otro
  proveedor o a la Cloud API directa sin tocar la lógica de tickets.
- En coexistencia se desactivan las listas de difusión de la app y WhatsApp para Windows; el
  celular debe abrirse al menos cada ~14 días o Meta desconecta la API.
- Los botones de respuesta rápida de las plantillas solo funcionan si el webhook está configurado
  en Kapso apuntando a `/api/webhooks/kapso` con el mismo secreto.
