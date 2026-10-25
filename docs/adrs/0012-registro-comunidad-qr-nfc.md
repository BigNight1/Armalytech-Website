# ADR 0012: Registro a la comunidad vía QR/NFC (ruta pública)

## Estado

Aceptado

## Contexto

El negocio quiere crear una base de clientes "comunidad" a partir de un QR/NFC físico colocado
**únicamente dentro del local**. El cliente escanea el código y llega a una ruta pública del sitio
con un formulario corto —sin registro pesado— para quedar en la base y recibir promociones por
WhatsApp. La asistencia se entiende como "escaneo + submit": cada envío con un número ya existente
suma una visita en lugar de duplicar el registro.

## Decisión

Crear una ruta pública sin autenticación en el frontend (nombre provisional `/registrar/usuario`,
**PENDIENTE confirmar el nombre definitivo** antes de implementar; los QR/NFC físicos apuntan a esta
URL, así que cambiarla luego obliga a regenerar los códigos). La ruta muestra un formulario con:

- Nombre.
- Apellido.
- Número de WhatsApp (validado y normalizado peruano — ver ADR 0014).
- Checkbox de consentimiento de marketing (ADR 0015).

Al completar, el frontend hace `POST /api/comunidad/registro` al backend NestJS (ADR 0016), que
valida, controla duplicados por número y persiste el cliente.

## Alternativas consideradas

- **QR que abre el chat de WhatsApp con mensaje pre-escrito (`wa.me`)** — mínima fricción, pero no
  produce datos estructurados (nombre/apellido), depende de captura manual y no deja registro de
  consentimiento; se descarta por el objetivo de tener una base limpia en DB.
- **n8n como puerta de entrada (webhook directo del formulario)** — menos código en NestJS pero
  deja el registro dependiente de la disponibilidad de n8n y crea dos caminos hacia la misma base
  (el panel igual lee por la API de NestJS); se descarta por el trade-off de disponibilidad.

## Consecuencias

- Un cliente que no completa el formulario no queda registrado; la conversión depende de la
  fricción del form (3 campos + checkbox).
- El QR/NFC es físico y local: cada asistencia implica presencia real en el local.
- La ruta pública debe resistir envíos repetidos (upsert por número, sin duplicar filas) y no
  puede exponer datos de otros clientes (sin paneles sobre esta ruta).
- El nombre de la ruta queda provisional; regenerar códigos físicos si se decide otro nombre.