# Envío de avisos de ticket al cliente por WhatsApp (propuesta de ideas)

## Objetivo
Definir cómo avisar al cliente cuando su ticket cambia de estado (sobre todo `listo`), aprovechando
que el negocio ya tiene **WhatsApp Business en el celular**, sin depender de la Cloud API de Meta
(hoy bloqueada: número "Sin conexión", la WABA no puede crear plantillas, app sin publicar — ver
`odd/tasks/plantillas-whatsapp.md`).

Este documento es una **propuesta para decisión del dueño**, no un plan aprobado. No se ha
implementado nada de lo que figura acá.

## Lo que ya existe (verificado en el código)

| Qué | Dónde | Estado |
|---|---|---|
| Botón "Enviar por WhatsApp" en el detalle del ticket | `frontend/src/admin/tickets/components/TicketDetailDrawer.jsx:278` | Funciona |
| Mensaje prellenado (nombre, equipo, ticket, estado, saldo, enlace público) | mismo archivo, líneas 284–292 | Funciona |
| Enlace público de seguimiento | `/ticket/<publicToken>` (UUID v4, ADR 0006) | Funciona |
| Consulta por código + celular | `/consultar-ticket` | Funciona |
| QR en el comprobante impreso | `TicketDetailDrawer.jsx:1183` vía `api.qrserver.com` | Funciona, con dependencia externa |
| Estados del ticket | `pendiente · aprobado · trabajando · listo · entregado · cancelado · abandonado` (ADR 0007) | — |
| Mensajería automática (n8n + Cloud API) | ADR 0026 / 0027 | Bloqueada por Meta |

> **Nota (decisión del dueño, 2026-10-07):** el *bot* de WhatsApp (el respondedor con IA en n8n) se va
> a retirar y no hay que construir sobre él. Lo que sigue vigente es el **envío de avisos** al cliente;
> las plantillas de ADR 0026/0027 solo aplican si algún día se activa la opción B.

### Hallazgos que conviene arreglar
- **La garantía del comprobante impreso contradice al sitio.** `TicketDetailDrawer.jsx:1177` dice
  *"30 días sobre la pieza cambiada"*; todo el sitio público dice **3 meses** (T9 de
  `seo-mejoras-competencia.md`). Se imprime y se entrega al cliente con un plazo distinto al publicado.
- **El QR depende de un tercero.** `api.qrserver.com` es un servicio externo: sin internet no se
  imprime el QR y la URL de seguimiento del cliente viaja a un servidor ajeno.
- **El número del negocio está hardcodeado 14 veces** en `frontend/src` (`51924548268`). Si cambia,
  hay que tocar 14 archivos, y ya hay dos formatos distintos conviviendo
  (`api.whatsapp.com/send/?phone=%2B51...` y `wa.me/51...`).
- **La ruta `/resena` no existe**, y es la que los ADR 0026/0027 usan como destino del pedido de
  reseña para poder cambiar la URL de Google sin rehacer plantillas.
- **Un solo mensaje para todos los estados.** Hoy el texto es casi el mismo siempre; solo `listo`
  agrega líneas. `pendiente` (presupuesto) y `entregado` (reseña) no tienen mensaje propio.
- **El envío no deja rastro.** No queda evento en el historial del ticket: no se sabe si al cliente
  se le avisó o no.

## La idea central

El botón actual ya resuelve el 80 %: abre el chat del cliente con el mensaje escrito y **una persona
pulsa enviar**. Eso es gratis, ilimitado, sin aprobación de Meta y funciona hoy. Lo que falta no es
"conectar la API", es **disparar el mensaje correcto en el momento correcto** y no olvidarse de
avisar.

## Opciones de canal

| Opción | Cómo funciona | Costo | Requisitos | Riesgo |
|---|---|---|---|---|
| **A. `wa.me` manual (recomendada para empezar)** | El panel abre el chat con el texto listo; el humano envía desde la app del celular o WhatsApp Web. | S/ 0 | Ninguno (ya está la base) | Ninguno |
| **B. Cloud API + n8n (ADR 0026/0027)** | Envío automático al cambiar de estado, con plantillas aprobadas. | Por mensaje (Marketing siempre; Utilidad gratis dentro de la ventana de 24 h) | Aprobar plantillas, publicar la app, **migrar el número** (deja de funcionar en el celular) o coexistencia vía Tech Provider | Medio |
| **C. Automatizar la app del celular (Baileys / whatsapp-web.js)** | Un servidor maneja la sesión de WhatsApp Web y envía solo. | S/ 0 en API | Servidor + sesión vinculada | **Alto: viola los términos de WhatsApp y puede bloquear el número del negocio.** No recomendado |
| **D. Híbrido** | A ahora; preparar B en paralelo y activar B cuando el volumen lo justifique. | S/ 0 al inicio | — | Bajo |

**Recomendación:** opción **D**. Con menos de ~20 tickets al día, el envío manual de un clic cubre la
necesidad y evita el costo por mensaje y la migración del número. La Cloud API solo se justifica
cuando se quiere avisar **sin que nadie intervenga** (por ejemplo, tickets que se cierran de noche).

## Ideas concretas (ordenadas por relación valor / esfuerzo)

### 1. Un mensaje por estado, en un solo lugar
Hoy el texto vive dentro de `TicketDetailDrawer.jsx`. Moverlo a un módulo compartido
(`src/shared/whatsappMessages.js`) con el número del negocio en una constante, y una plantilla por
estado:

- `pendiente` → diagnóstico listo, precio y tiempo estimado, **pedir aprobación**.
- `aprobado` → confirmación de que entró a taller.
- `listo` → listo para recoger, saldo pendiente, **horario 10:00–20:00**, enlace de cómo llegar.
- `entregado` → gracias + **garantía de 3 meses sobre el repuesto** + pedir reseña.
- `abandonado` → aviso de que el equipo sigue en tienda.

Beneficio extra: el mismo módulo puede alimentar el comprobante impreso y así se corrige de raíz la
contradicción de los 30 días.

### 2. Disparador al pasar a `listo` (el de mayor impacto)
Cambiar un ticket a `listo` es el momento en que el cliente tiene que enterarse. Al confirmar esa
transición, mostrar de inmediato un aviso: *"Avísale al cliente"* con el botón ya armado, y un
indicador visible en la lista de tickets para los `listo` sin avisar.

Hoy, si nadie se acuerda, el equipo se queda en el estante y el cliente no lo sabe.

### 3. Recordatorio de `listo` sin recoger
Filtro/lista *"Listos hace más de 3 días sin recoger"* con el mismo botón. Es recuperación de
ingresos con muy poco código (una consulta que ya casi existe + el generador de mensajes).

### 4. Botón "Enviar presupuesto" en `pendiente`
La transición `pendiente → aprobado` es la decisión que paga el trabajo. Un mensaje con diagnóstico,
precio y tiempo mejora la tasa de aprobación y reduce los tickets abandonados.

### 5. Ruta `/resena`
Página mínima que redirige al formulario de reseña de Google. Desbloquea el pedido de reseña **hoy**,
sin plantillas ni API, y deja la URL de Google cambiable sin tocar nada más.

### 6. Arreglar el QR del comprobante
- Corregir la garantía impresa a **3 meses**.
- Generar el QR localmente (paquete `qrcode`, en el backend al crear el ticket o en el navegador al
  imprimir) para no depender de `api.qrserver.com`.
- Evaluar un **segundo QR** que abra el chat del negocio (`wa.me`) para que el cliente escriba con un
  escaneo.

### 7. Acciones en la página pública del ticket
`/ticket/<token>` ya existe y es la página que el cliente abre. Agregar ahí:
- *"Escribir por WhatsApp"* con el número del ticket ya cargado.
- *"Cómo llegar"*.
- Un botón tipo *"Confirmo que paso a recogerlo"* que registre el aviso (sin exponer datos: la
  validación pública ya está resuelta en `getPublicByToken`).

### 8. Registrar el envío en el historial
Un evento *"Aviso de listo enviado"* con fecha y quién lo mandó (el historial del ticket ya existe,
ADR 0018/0025). Sirve para no repetir el aviso y para saber si el cliente fue informado. Si se pide
la reseña, avisar antes de reenviarla (ADR 0027 §4).

### 9. Vincular WhatsApp Web en la PC del taller
Con el número del negocio como **dispositivo vinculado** en la PC, el botón del panel abre el chat
directamente en WhatsApp Web y el envío es un clic desde el teclado, sin sacar el celular. Si no está
vinculado, el enlace `wa.me` cae en una página de descarga en vez del chat.

### 10. Aprovechar la app de WhatsApp Business (gratis, sin código)
- **Respuestas rápidas** (`/listo`, `/presupuesto`) como respaldo cuando se atiende desde el celular.
- **Etiquetas** para ordenar: *esperando aprobación*, *listo sin recoger*, *garantía*.
- **Mensaje de ausencia / horario** para lo que llega fuera de 10:00–20:00.
- **Catálogo / enlace al sitio** apuntando al sitio nuevo (ya prerenderizado).

### 11. Centralizar el número
Una sola constante para `51924548268` y un solo formato de enlace. Hoy hay 14 puntos hardcodeados y
dos formatos distintos.

## Decisiones que necesito del dueño

1. **Volumen real:** ¿cuántos tickets al día y cuántos pasan a `listo`? Define si la opción B se
   justifica.
2. **Automático o un clic:** ¿basta con que el panel le avise al personal y el personal envíe
   (opción A), o se necesita que salga solo aunque nadie esté en el panel (opción B)?
3. **Coexistencia o migración** (ya pendiente en `plantillas-whatsapp.md` §76): migrar el número a la
   API lo saca de la app del celular; la coexistencia requiere un Tech Provider (360dialog, Twilio,
   Gupshup) y tiene costo.
4. **¿El aviso debe incluir el comprobante?** Si se quiere mandar el ticket como imagen/PDF, hay que
   generar el archivo además del texto (hoy solo existe `window.print()`).
5. **¿Se automatiza el recordatorio de reseña** al pasar a `entregado`, o se deja manual?

## Fuera de alcance
- Cambios en tickets y admin sin pedido explícito del dueño (regla del proyecto).
- Migrar el número a la Cloud API (decisión del dueño, ver arriba).
- Automatizar la app del celular (opción C): descartada por riesgo de bloqueo.

## Siguiente paso propuesto
Implementar el bloque **barato y sin riesgo**: ideas 1, 2, 5, 6 (garantía) y 8 — sin tocar la API ni
el número. Eso ya cambia el resultado (el cliente se entera y el comprobante deja de contradecir al
sitio) y no compromete ninguna decisión sobre la Cloud API.
