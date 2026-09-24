# ADR 0013: Modelo de datos de clientes de la comunidad

## Estado

Aceptado

## Contexto

La comunidad necesita persistir a cada persona que escanea el QR/NFC local y completa el
formulario, soportando deduplicación por número, conteo de visitas y el consentimiento de
marketing exigido por Meta. La base ya es MongoDB Atlas (ADR 0003) con backend NestJS/Mongoose.

## Decisión

Nueva colección **`clientes`** en la misma base MongoDB, con la siguiente estructura mínima:

```
{
  nombre: string,
  apellido: string,
  telefono: string,          // E.164 peruano normalizado, ej. "51965728013" (ADR 0014)
  visitas: number,           // comienza en 1; se incrementa en cada registro repetido
  consentimiento: { aceptado: boolean, fecha: Date },  // ADR 0015
  creadoEn: Date,
  ultimaVisitaEn: Date
}
```

- **Índice único sobre `telefono`**: garantiza a nivel de base que nunca existan dos clientes con
  el mismo número (el registro usa upsert: si existe, suma `visitas` y actualiza
  `ultimaVisitaEn`; si no, crea).
- El campo `visitas` alimenta la lógica de fidelidad/descuentos futura (pendiente de definir reglas
  de negocio, fuera de esta versión).

## Alternativas consideradas

- **Embeder clientes dentro de la colección `tickets`** — evita una colección nueva, pero mezcla
  la entidad "persona cliente" (que vive más que un ticket) con el ciclo de reparación; se
  descarta porque el cliente de la comunidad no requiere haber tenido un ticket.
- **PostgreSQL relacional** — ya descartado globalmente en ADR 0003 (decisión del usuario por
  MongoDB).

## Consecuencias

- Sin foreign keys (NoSQL), la unicidad se garantiza con índice + lógica de upsert a nivel de
  aplicación; hay que probar el caso concurrente (dos submits del mismo número) con el
  `upsert` condicional de Mongoose.
- El panel admin lee de esta colección vía API NestJS (listado, totales, visitas).
- Almacenar el consentimiento junto al cliente permite auditar envíos y atender requerimientos de
  Meta sin tablas aparte.