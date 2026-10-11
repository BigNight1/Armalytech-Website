# ADR 0014: Normalización de números de WhatsApp peruanos

## Estado

Aceptado

## Contexto

El cliente escribe su número libremente en el formulario. Para deduplicar correctamente y para
enviar mensajes con la API de Meta (WhatsApp Business Cloud API) sin errores, el número debe
almacenarse siempre con el mismo formato estándar. El público del negocio es peruano.

## Decisión

Validar y normalizar el número en el backend NestJS **antes de guardar**:

- Formato canónico de almacenamiento: **E.164 sin `+`**, exactamente `51` + 9 dígitos, sin
  espacios, guiones ni paréntesis. Ejemplo: `51965728013`.
- Aceptar en el input variantes habituales (`+51 965 728 013`, `965728013`, `51 965728013`) y
  normalizarlas al canónico.
- Regla de validación: solo números peruanos — debe cumplir `^51[0-9]{9}$` tras normalizar; si no,
  el formulario muestra error y no registra.
- El frontend aplica una validación liviana (formato) y el backend la validación estricta; el
  backend es la fuente de verdad.

## Alternativas consideradas

- **Guardar el número tal cual lo escribe el cliente** — rompe la deduplicación (el mismo número
  escrito de dos formas parecería dos clientes) y complica el envío por Meta; se descarta.
- **Guardar con `+` (`+51965728013`)** — válido en E.164, pero más propenso a errores de
  concatenación al armar payloads de Meta; se estandariza sin `+`.
- **Soportar países no peruanos** — el negocio atiende público local; se descarta por simplicidad
  y porque la mensajería campaña se enfoca en Perú.

## Consecuencias

- La base queda limpia y deduplicable por el índice único de `telefono` (ADR 0013).
- Los payloads hacia Meta usan el mismo número sin transformaciones extra.
- Trade-off: un cliente extranjero con WhatsApp (ej. turista) no puede registrarse; se acepta como
  límite explícito del público objetivo.