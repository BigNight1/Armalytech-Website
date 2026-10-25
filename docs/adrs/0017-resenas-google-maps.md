# ADR 0017: Pedido de reseña en Google Maps post-entrega

## Estado

Aceptado

## Contexto

Como objetivo de crecimiento, tras atender a un cliente se le pide una reseña en Google Maps. El
sistema de tickets ya tiene el estado `entregado` (ADR 0007), que marca el momento natural para el
pedido. Google **no permite** publicar reseñas automáticamente desde APIs de negocio; el único
camino válido es enviar al cliente un enlace directo que abre el formulario de reseña de Google.

## Decisión

Cuando un ticket cambia a `entregado`, el backend NestJS lo notifica a n8n (mismo mecanismo que en
ADR 0016). n8n envía al cliente un mensaje de WhatsApp que pide evaluar la atención e incluye un
**enlace directo a la reseña del local en Google Maps** (URL de reseña de la ficha de Google del
negocio). El mensaje solo se envía si el cliente tiene consentimiento y su número está en la base
de la comunidad (si no, queda fuera de esta automatización).

- No se automatiza la publicación de la reseña (prohibido por Google); se automatiza el **pedido**
  con el link correcto.
- El enlace usado debe verificarse una vez en producción (la URL de reseña de Google tiene un
  formato específico por negocio).

## Alternativas consideradas

- **Formulario de reseña propio dentro del sitio** — no alimenta Google Maps (no tiene valor de
  posicionamiento local); se descarta como sustituto del link a Google.
- **Autopublicar la reseña en nombre del cliente** — no permitido por Google ni por Meta; se
  descarta por riesgo de penalización.
- **Pedir la reseña por mensaje manual** — viable pero no escala y pierde el disparo sistemático
  con el estado `entregado`; se descarta.

## Consecuencias

- La tasa de reseñas depende de la disposición del cliente a tocar el enlace; el sistema solo
  garantiza el pedido consistente y oportuno.
- El ticket debe vincularse con el cliente de la comunidad (número de WhatsApp) para saber a quién
  enviar; si el cliente solo tiene ticket sin registro de comunidad, el pedido no se dispara.
- Trade-off: un envío de marketing post-servicio que no se dosifique puede molestar; se recomienda
  enviar una sola vez por ticket entregado.