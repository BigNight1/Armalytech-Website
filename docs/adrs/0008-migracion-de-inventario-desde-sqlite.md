# ADR 0008: Migración del inventario desde SQLite

## Estado

Aceptado

## Contexto

El PRD exige migrar el inventario (marcas → modelos → repuestos) desde la base SQLite local de la
aplicación de escritorio Invetario-Armalytech hacia la base web, "conservando la estructura
jerárquica ya existente". El repositorio actual no contiene esa base (vive en otra PC), por lo que
la migración es un proceso puntual, no parte del runtime.

## Decisión

**Resuelto (2026-09-23), ver Actualización más abajo.** Se revisó el proyecto de escritorio
`Invetario-Armalytech` (Electron + SQLite, tablas `brands`/`models`/`parts`/`cierre_dia`) y se
construyó el script de migración con ese schema real.

Con eso definido, construir un **script de migración one-off** (Node.js) que:

1. Lee la base SQLite de Invetario-Armalytech (archivo local entregado por el usuario).
2. Exporta marcas, modelos y repuestos conservando la jerarquía.
3. Inserta en la colección MongoDB de forma idempotente (por nombre único), reportando conteos por
   entidad y cualquier conflicto, en modo dry-run antes de escribir.

El endpoint `/api/migration/import` del ADR 0005 (solo admin, en el backend NestJS) es el punto de
carga en producción, o el script corre por CLI contra Atlas.

## Alternativas consideradas

- **Reingreso manual desde el panel** — rechazado: el PRD exige migrar los datos existentes y
  reingresarlos a mano es propenso a error y lento.
- **ETL con herramienta externa** — sobre-dimensionado: es una carga única de pocas entidades, no un
  flujo continuo.
- **Definir el schema de la SQLite por suposición** — rechazado: rompe la garantía de conservar "la
  estructura jerárquica ya existente" y obligaría a reescribir el script al ver los datos reales.

## Consecuencias

- Los datos existentes se preservan con su estructura, cumpliendo el PRD — siempre que el inventario
  de la app desktop tenga la jerarquía esperada.
- Trade-off: **bloqueado hasta revisar el proyecto desktop** — el usuario debe proveer acceso al
  repo/código/DB de Invetario-Armalytech (o un dump de la SQLite) para cerrar la definición.
- Trade-off: la migración asume que los nombres de marcas/modelos son identificadores confiables
  para la idempotencia; si hay duplicados, el reporte los muestra y el usuario decide.
- Trade-off: sin backups (ADR 0003) un error en el import puede dañar el inventario; el dry-run
  previo y la posibilidad de re-importar desde la SQLite original son la mitigación mínima.

## Actualización (2026-09-23)

Revisado el proyecto de escritorio (`Invetario-Armalytech`, Electron + better-sqlite3). Schema
real: tablas `brands` (marcas), `models` (marcaId, modelos), `parts` (modeloId, cantidad,
repuestos) y `cierre_dia` (planilla de cierre de caja diario, ver ADR 0019 sobre dónde se muestra
en el panel). Se implementó `backend/scripts/migrate-sqlite.ts`:

- Lee el archivo SQLite pasado por argumento con `better-sqlite3`, reutiliza los mismos esquemas
  de Mongoose que usa la app en runtime (`inventory` y `cash-closings`) en vez de pasar por HTTP.
- Idempotente por clave natural: nombre de marca; marca + nombre de modelo; modelo + nombre de
  repuesto; fecha + índice de fila para `cierre_dia`. Reejecutar el script no duplica datos.
- Soporta `--dry-run` (solo lee y cuenta, no escribe) y `--help`. Requiere `MONGODB_URI` en el
  entorno para una corrida real (no dry-run).
- Verificado contra un fixture SQLite sintético (`backend/README.md`, sección de migración).