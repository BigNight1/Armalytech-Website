# ADR 0026: Bot de WhatsApp en n8n, ventana de 24 h y pedido de reseña al entregar

## Estado

Propuesto (refina ADR 0016 y ADR 0017)

## Contexto

ADR 0016 dejó a n8n como orquestador de la mensajería con la API de WhatsApp de Meta, y ADR 0017
definió pedir una reseña de Google al pasar un ticket a `entregado`. Al llevarlo a producción
aparecieron restricciones que esos ADRs no cubrían:

- **Modelo de cobro de Meta (desde julio 2025, por mensaje entregado):** el texto libre y las
  plantillas de **Utilidad** son gratis dentro de la **ventana de 24 h** que abre el cliente cuando
  escribe; las plantillas de **Marketing** se cobran siempre; fuera de la ventana solo se puede
  enviar una plantilla aprobada.
- **Enviar una plantilla no abre la ventana:** solo la abre un mensaje del cliente. Un segundo
  mensaje de texto libre después de una plantilla no se entrega si el cliente no respondió.
- Se quiere un **bot** que responda consultas, con opción de derivar a una persona.
- Infraestructura disponible: servidor propio con Dokploy (n8n + Postgres + Ollama `qwen2.5:3b`,
  solo CPU, ~4 s por respuesta corta con el modelo cargado).

## Decisión

### 1. Mensajes entrantes (bot)

- El webhook de Meta lo recibe **n8n** (WhatsApp Trigger), no NestJS: el bot vive en n8n.
- Cada mensaje pasa primero por un **clasificador determinista** (palabras clave, sin IA), en este
  orden:
  - `BAJA` / "dejar de recibir promociones" → confirma la baja y avisa al backend para revocar el
    consentimiento (ADR 0015).
  - "asesor", "hablar con alguien", "humano" → avisa al cliente, notifica al dueño y **pausa el bot
    12 h** para ese número; el cliente escribe "bot" para reanudar.
  - Código de ticket (`AT-000123`) → consulta la API pública de tickets con el número de WhatsApp
    del remitente (misma validación que la página pública) y responde el estado.
  - Botón "Gracias, voy a recogerlo" → confirma y deja la ventana de 24 h abierta.
  - Resto → agente de IA (Ollama) con memoria corta por número y prompt que prohíbe inventar
    precios, plazos u horarios.
- El bot registra **la hora del último mensaje de cada cliente** para saber si la ventana de 24 h
  está abierta.

### 2. Ticket `listo`

- Se envía la plantilla de **Utilidad** `ticket_listo` (nombre, equipo, código, enlace al detalle y
  botón "Cómo llegar").
- La plantilla incluye un botón de **respuesta rápida "Gracias, voy a recogerlo"**: al tocarlo el
  cliente abre la ventana de 24 h sin costo.

### 3. Ticket `entregado` → pedido de reseña (refina ADR 0017)

El backend notifica a n8n y n8n decide **sin plantilla primero**:

| Situación | Acción | Costo |
|---|---|---|
| El cliente escribió en las últimas 24 h | Mensaje de reseña como **texto libre** (ya redactado, no generado por IA) | Gratis |
| Fuera de la ventana y **con** consentimiento de marketing | Plantilla `resena_google` (Marketing) | Pagado |
| Fuera de la ventana y **sin** consentimiento | No se envía nada | — |

- Se envía como máximo **una vez por ticket**.
- El enlace apunta a `https://www.armalytech.com/resena`, que redirige al formulario de reseña de
  Google; así la URL final se puede cambiar sin tocar la plantilla aprobada.

### 4. Plantillas a solicitar en Meta

`ticket_listo` (Utilidad), `resena_google`, `promo_descuento`, `invitar_volver` y
`bienvenida_comunidad` (Marketing, con botón de baja). Las de Marketing solo se envían a clientes con
consentimiento (ADR 0015).

## Alternativas consideradas

- **Enviar siempre la plantilla `resena_google`** — simple, pero se paga en cada entrega aunque el
  cliente acabe de escribir; se descarta por costo.
- **Plantilla combinada "listo + reseña" (`equipo_listo_resena`)** — Meta la reclasifica como
  Marketing, lo que la vuelve pagada y la limita a clientes con consentimiento; se descarta en favor
  de separar aviso (Utilidad) y reseña.
- **Segundo mensaje de texto libre justo después de `ticket_listo`** — Meta no lo entrega si el
  cliente no respondió; se reemplaza por el botón de respuesta rápida.
- **Webhook de Meta recibido por NestJS** — mantiene los datos en el backend, pero obliga a
  reenviar todo a n8n donde vive el bot; se descarta. NestJS sigue siendo dueño de los datos
  (bajas y estados de entrega llegan por un endpoint).
- **IA externa (Groq, Gemini)** — más rápida, pero los mensajes salen del servidor y tiene límites
  de uso; se prefiere Ollama local. Cambiar de modelo es un ajuste en n8n.

## Consecuencias

- La mayoría de los pedidos de reseña salen **gratis**; el costo queda acotado a clientes que no
  escribieron y aceptaron promociones.
- **Estado de la ventana y del modo "asesor" en n8n:** se guarda en los datos estáticos del flujo.
  Es simple, pero se pierde si el flujo se borra o reimporta y solo se actualiza en ejecuciones de
  producción. **Resuelto en ADR 0027:** `lastInboundAt` pasa a guardarse en el backend (NestJS),
  porque el panel necesita saber si la ventana está abierta; `handoffUntil` puede quedar en n8n.
- **Consentimiento (decidido por el usuario):** el mensaje de reseña como texto libre dentro de la
  ventana se envía a **todo cliente con ticket entregado**, esté o no registrado en la comunidad y
  haya o no aceptado promociones, por tratarse de una respuesta a una conversación abierta. La
  plantilla pagada `resena_google` sigue limitada a clientes con consentimiento (ADR 0015). El
  destinatario sale del teléfono del ticket, no del registro de comunidad (ADR 0017 exigía registro).
- El envío manual desde el panel se define en ADR 0027.
- Requiere cambios en el backend: evento de cambio de estado (`listo`, `entregado`) hacia n8n con
  token compartido, payload con plantilla y parámetros en vez de texto libre, endpoint para bajas y
  estados de entrega, y la ruta `/resena` en el sitio.
- Pendientes externos: verificación del negocio en Meta (el bloqueo `2494160` impide crear
  plantillas), aprobación de plantillas, publicación de la app de Meta y canal para avisar al dueño
  (Telegram o WhatsApp).
- El bot depende de un modelo pequeño en CPU: respuestas de ~4 s y calidad limitada; las rutas
  críticas (baja, asesor, ticket) no pasan por la IA.
