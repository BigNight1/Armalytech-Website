# ADR 0016: Integración n8n + Meta WhatsApp Business API

## Estado

Aceptado

## Contexto

El negocio quiere enviar automáticamente: mensaje de bienvenida al registrarse, campañas de
promociones (ofertas, días festivos) y pedido de reseña de Google Maps cuando un ticket pasa a
`entregado` (ADR 0017). El envío oficial se hace por la API de Meta (WhatsApp Business Cloud API).
El punto de entrada del registro quedó en NestJS (decisión del usuario, opción A).

## Decisión

- **NestJS es dueño del registro**: `POST /api/comunidad/registro` valida, normaliza, controla
  duplicados y persiste en Mongo (ADRs 0012–0015). Después de persistir, **notifica a n8n** por
  webhook HTTP con los datos mínimos del nuevo registro (id, teléfono, nombre, tipo de evento).
- **n8n orquesta la mensajería**: recibe los eventos (registro nuevo, ticket entregado), consulta
  plantillas y llama a la **Meta WhatsApp Business Cloud API** con el número de negocio verificado.
  Mensajes inmediatos usan la ventana de sesión de 24h cuando aplica; campañas fuera de la ventana
  usan plantillas aprobadas por Meta.
- La bienvenida automática al registrarse es el comportamiento por defecto (**REVISAR**: confirmar
  si el usuario prefiere envío manual al inicio).
- n8n solo envía a clientes con `consentimiento.aceptado === true` (ADR 0015).

## Alternativas consideradas

- **Enviar directamente desde NestJS sin n8n** — concentra todo en el backend, pero acopla lógica
  de negocio con el proveedor de mensajería y hace más difícil orquestar campañas visuales
  (ofertas programadas, plantillas, reintentos); se descarta por flexibilidad.
- **n8n como puerta de entrada del formulario** (webhook directo) — rechazada por el usuario:
  deja el registro dependiente de n8n y crea dos caminos a la base (ver ADR 0012).
- **WhatsApp manual/celular** — no escala campañas ni deja trazabilidad; se descarta.

## Consecuencias

- El registro nunca depende de n8n: si n8n cae, el cliente se registra igual y el evento queda
  pendiente de reprocesar (retry en n8n al volver).
- Hay un costo por conversación de la API de Meta (modelo tarifario por conversación iniciada por
  el negocio fuera de la ventana de 24h); campañas masivas implican presupuesto.
- n8n debe exponer un webhook público seguro (token) para NestJS; hay que definir secretos en
  Vercel/entorno.
- Pendiente: definir plantillas aprobadas en Meta (bienvenida, oferta, reseña) y el manejo de
  revocación de consentimiento (p. ej. respuesta "BAJA").