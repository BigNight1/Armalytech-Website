# ADR 0027: Mensajes rápidos de WhatsApp desde el panel (envío manual)

## Estado

Propuesto (complementa ADR 0026)

## Contexto

Además del envío automático al pasar un ticket a `entregado` (ADR 0026), el equipo muchas veces
atiende al cliente en persona o por WhatsApp de forma manual y, al terminar ("quedó feliz"), quiere
pedirle la reseña **sin escribir el mensaje a mano**. El panel ya tiene botones de mensajería en el
detalle del cliente ("Enviar promo 20%", "Pedir reseña", "Invitar a volver"), que hoy mandan texto
libre a n8n sin considerar las reglas de Meta:

- El texto libre solo se entrega dentro de la **ventana de 24 h** abierta por el cliente.
- Fuera de la ventana solo se puede enviar una **plantilla aprobada** (Marketing = pagada).
- El número del negocio está en modo coexistencia: la app **WhatsApp Business** del celular sigue
  funcionando y lo que se envía desde ahí no pasa por la API ni tiene costo de API.

## Decisión

1. **Mensajes predefinidos:** cada botón tiene un texto ya redactado y revisado (no generado por
   IA). Para la reseña:

   > ¡Gracias por confiar en ArmalyTech, {nombre}! 💙 Nos ayudaría muchísimo que nos dejes tu
   > comentario para seguir creciendo y ayudar a otras personas con sus celulares ⭐ {enlace}

2. **Botón disponible en el ticket y en el cliente:** "Pedir reseña" aparece en el detalle del
   ticket (usa el teléfono del ticket, aunque el cliente no esté en la comunidad) y en el detalle
   del cliente.

3. **El panel muestra antes de enviar cómo saldrá el mensaje**, con la misma regla que ADR 0026:

   | Estado | Qué ofrece el botón | Costo |
   |---|---|---|
   | Cliente escribió en las últimas 24 h | **Enviar ahora** (texto libre vía API) | Gratis |
   | Fuera de la ventana, con consentimiento | **Enviar plantilla** `resena_google` (se indica que tiene costo) | Pagado |
   | Fuera de la ventana, sin consentimiento | **Abrir en WhatsApp** con el texto ya escrito (`wa.me/<número>?text=...`) para enviarlo desde la app del negocio | Sin costo de API |

4. **Registro en el historial:** cada envío (automático o manual) queda como evento
   "Reseña solicitada" en el historial del ticket y del cliente, con fecha, canal y quién lo envió.
   Si ya se pidió la reseña para ese ticket, el botón lo avisa antes de reenviar.

5. **La hora del último mensaje del cliente vive en el backend:** n8n informa a NestJS cada mensaje
   entrante (`lastInboundAt` por número) para que el panel pueda saber si la ventana está abierta.
   Esto resuelve el punto "REVISAR" de ADR 0026 sobre dónde guardar ese estado.

## Alternativas consideradas

- **Dejar los botones como están (texto libre siempre)** — fuera de la ventana Meta no entrega el
  mensaje y el panel no lo avisa; se descarta.
- **Usar siempre la plantilla** — funciona siempre, pero se paga incluso cuando el cliente acaba de
  escribir; se descarta por costo.
- **Solo copiar el texto al portapapeles** — cero costo, pero obliga a buscar el chat a mano; se
  reemplaza por el enlace `wa.me`, que abre el chat con el texto listo.
- **Mantener la ventana solo en n8n** — el panel no podría mostrar el estado antes de enviar; se
  descarta.

## Consecuencias

- El equipo pide la reseña con un clic y sin redactar, y el sistema elige la opción gratis cuando
  existe.
- El envío por `wa.me` depende de que quien usa el panel tenga abierta la app WhatsApp Business del
  número del negocio (celular o WhatsApp Web).
- Requiere en el backend: campo `lastInboundAt` por teléfono, endpoint para que n8n lo actualice,
  endpoint "enviar mensaje rápido" que aplica la regla, y el evento "Reseña solicitada" en el
  historial. En el frontend: botón en el detalle del ticket, confirmación con el canal elegido y
  aviso de costo.
- Los otros botones ("Enviar promo", "Invitar a volver") siguen la misma regla, con sus plantillas
  de Marketing (ADR 0026 §4) y siempre limitados a clientes con consentimiento.
