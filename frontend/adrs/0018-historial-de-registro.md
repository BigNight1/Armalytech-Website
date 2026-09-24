# ADR 0018: Historial de registro y asistencias

## Estado

Aceptado

## Contexto

El panel administrativo incluirá una sección **Historial de registro**: la trazabilidad de cada
evento de la comunidad (registro inicial, visitas posteriores con el mismo número, intentos
rechazados). ADR 0013 guarda el contador `visitas` y `ultimaVisitaEn` en el cliente, pero eso
solo da el resumen — no el detalle de cuándo ocurrió cada evento.

## Decisión

Nueva colección **`historial`** (event log) en la misma base MongoDB:

```
{
  clienteId: ObjectId,        // referencia al cliente de la colección `clientes`
  telefono: string,           // E.164 normalizado, útil para búsqueda/huérfanos
  tipoEvento: 'registro' | 'visita' | 'registro_rechazado',
  motivoRechazo: string|null, // ej. "numero_invalido" | "sin_consentimiento"
  fecha: Date,
  canal: 'qr' | 'nfc'         // origen físico del escaneo
}
```

- Se escribe **un documento por evento**: el primer registro (`registro`), cada vuelta del mismo
  número (`visita`) y cada envío inválido (`registro_rechazado` con motivo).
- Índice por `fecha` (descendente) para la vista de historial y por `telefono` para búsqueda.
- El contador `visitas` del cliente sigue siendo la fuente para fidelidad; el `historial` es la
  evidencia detallada que alimenta la sección del panel.

## Alternativas consideradas

- **Embedir el historial como array dentro del documento `clientes`** — evita una colección,
  pero el documento crece sin límite con cada visita y complica consultas de rango por fecha; se
  descarta por volumen futuro.
- **Sin historial (solo contador)** — panel más simple pero sin trazabilidad ni detalle por
  evento; se descarta porque el usuario pidió explícitamente la sección historial.

## Consecuencias

- El panel tiene dos vistas complementarias: resumen por cliente (visitas) y línea de tiempo de
  eventos (historial).
- Trade-off: una colección adicional que crece con cada escaneo; el volumen actual (local, pocos
  registros por día) está muy lejos de preocupar en el free tier M0.
- `motivoRechazo` da visibilidad de fricción real del formulario (cuántos intentan registrarse y
  fallan por número inválido o por el checkbox de consentimiento).

## Nota (2026-09-23)

La sección **Historial** del sidebar del panel admin se reservó para el cierre de caja diario
(ver [ADR-0019](0019-historial-panel-cierre-caja.md)). El `historial` de comunidad descrito en
este ADR se mostrará más adelante bajo la sección **Clientes**, con otro nombre en la UI. El
modelo de datos de este ADR no cambia.