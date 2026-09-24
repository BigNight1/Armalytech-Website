# Meta WhatsApp template: `equipo_listo_resena`

Sent by n8n when a ticket changes to `listo` (ADR 0007), only when the client's
"Acepta promociones" is **Aprobó** (`marketingConsent === true`, ADR 0015). Sent at most
once per ticket. Clients marked **Descartó** never receive it.

## Template to create in Meta (WhatsApp Manager → Plantillas de mensajes)

- **Name:** `equipo_listo_resena`
- **Language:** Spanish (`es` / `es_PE`)
- **Category:** request `UTILITY` (pickup notice). Meta decides the final category: the
  review request may get it reclassified as `MARKETING`, which changes the price per message.
  If Meta rejects it as utility, split it into two templates (pickup = utility, review = marketing).
- **Header (optional):** `LOCATION` — the shop's map pin, filled in at send time with the
  store's latitude/longitude, name and address. This shows the Google map inside the chat.

### Body

```
Hola {{1}} 👋

¡Buenas noticias! Tu {{2}} ya está listo ✅
Puedes pasar a recogerlo a ArmalyTech en nuestro horario de atención.

Al recogerlo, nos ayudarías muchísimo recomendándonos y dejándonos tu reseña en Google Maps ⭐
¡Gracias por confiar en nosotros! 💙
```

Sample values for Meta review: `{{1}}` = `Juan`, `{{2}}` = `iPhone 11`.

### Footer

```
ArmalyTech — Servicio técnico de celulares
```

### Buttons (type URL, max 2)

1. `⭐ Dejar reseña` → Google Maps review link of the business (the `writereview` URL
   from the Google Business Profile; verify it once in production, ADR 0017).
2. `📍 Cómo llegar` → Google Maps link to the shop.

## Values n8n needs (environment/credentials, never committed)

| Variable | What it is |
| --- | --- |
| `META_WHATSAPP_TOKEN` | Permanent access token of the Meta app (system user). |
| `META_PHONE_NUMBER_ID` | ID of the verified business number. |
| `STORE_LAT`, `STORE_LNG`, `STORE_NAME`, `STORE_ADDRESS` | For the location header. |
| `N8N_WEBHOOK_TOKEN` | Shared secret NestJS sends when it calls the n8n webhook. |

## Pending before it can run

- Tickets (Phase 2): the `listo` transition must notify n8n and link the ticket to the client's phone.
- Verified business number in Meta and approval of this template.
- Where n8n runs (local Docker, n8n Cloud or a server).
