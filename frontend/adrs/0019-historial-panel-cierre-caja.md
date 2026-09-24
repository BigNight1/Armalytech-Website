# ADR 0019: Historial del panel = cierre de caja diario

## Estado

Aceptado

## Contexto

La app de escritorio `Invetario-Armalytech` (Electron + SQLite) tiene una pantalla `cierre_dia`:
una planilla diaria de caja (ingresos/egresos en efectivo y Yape, con detalle) que el negocio
usa a diario. Al traer el inventario y el panel admin a la web (`odd/tasks/panel-inventario-historial.md`),
el usuario decidió (2026-09-23) que la sección **Historial** del sidebar del panel sea esta
planilla de cierre de caja, no la entidad `historial` de eventos de comunidad que ya definía el
ADR 0018 (registro/visita/registro_rechazado de clientes QR/NFC).

Ambas features comparten el mismo nombre de sección ("Historial") pero son conceptos distintos:
una es contable (caja diaria, prioridad ahora), la otra es trazabilidad de comunidad (Fase 4,
todavía no implementada).

## Decisión

- El sidebar del panel admin tiene, por ahora, dos secciones: **Inventario** (marcas → modelos →
  repuestos) e **Historial** (planilla de cierre de caja diario, tipo hoja de cálculo, backend
  `cash-closings`, ver contrato de API en el feature doc).
- El `historial` de comunidad del ADR 0018 (registro/visita/registro_rechazado) se mostrará más
  adelante bajo la sección **Clientes** (Fase 4, comunidad), con otro nombre en la UI para no
  chocar con esta sección — por ejemplo "Historial de registro" o "Actividad de clientes"; el
  nombre exacto se define al implementar esa fase.
- No se renombra ni se toca el modelo de datos del ADR 0018; solo se reserva la palabra
  "Historial" del sidebar para el cierre de caja.

## Alternativas consideradas

- **Usar "Historial" para la comunidad y otro nombre para caja** — descartado: el usuario pidió
  explícitamente traer primero la pantalla de cierre de caja de la app de escritorio bajo ese
  nombre; la comunidad todavía no tiene UI construida.
- **Una sola sección "Historial" que combine caja y comunidad** — descartado: son dominios y
  modelos de datos distintos (`cash-closings` vs. `historial` de ADR 0018); mezclarlos en una
  sola pantalla complica el diseño sin necesidad.

## Consecuencias

- El sidebar del panel queda: Inventario, Historial (caja). Clientes/Tickets (comunidad,
  tickets) se agregan en fases posteriores sin reutilizar el nombre "Historial".
- El feature doc `odd/tasks/panel-inventario-historial.md` y el backend usan `cash-closings` como
  nombre técnico del módulo para evitar ambigüedad con el `historial` de ADR 0018.
- Cuando se implemente la sección Clientes (Fase 4), habrá que elegir el nombre final de la vista
  de historial de comunidad y actualizar la navegación del panel; no afecta el modelo de datos.
