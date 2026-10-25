# ADR 0006: Modelo de datos — tickets e inventario

## Estado

Aceptado

## Contexto

El PRD no trae un Design.md, por lo que el modelo se deriva directamente del PRD: entidades
tickets, cliente y el inventario jerárquico (marcas → modelos → repuestos) que ya existe en la
SQLite de Invetario-Armalytech y debe conservar su estructura al migrar. El caso borde exige un
identificador de ticket público no adivinable (no secuencial).

## Decisión

Colecciones MongoDB:

- **tickets**: `{ cliente: { nombre, apellido, telefono }, equipo: { tipo, marca?, modelo?,
  descripcion? }, estado, notas: [{ texto, fecha }], publicToken, repuestosUsados:
  [{ repuestoId, nombre, cantidad }], historialEstados: [{ estado, fecha }], fechas
  (creacion, actualizacion, entrega?) }`.
- **marcas**: `{ _id, nombre }`.
- **modelos**: `{ _id, marcaId, nombre }`.
- **repuestos**: `{ _id, modeloId, nombre, cantidad }`.
- **admin**: `{ _id, username, passwordHash, createdAt }` — credencial del panel, hash persistido
  (ADR 0004), creada en bootstrap.

El `publicToken` se genera con un identificador aleatorio criptográfico (`crypto.randomUUID` o
equivalente), con índice único, de modo que un cliente no pueda adivinar el enlace de otro
(reemplaza el `/ticket/1` secuencial que el PRD prohíbe). Se permite a un cliente tener varios
tickets activos (mismo teléfono, múltiples documentos). El historial de estados sostiene el caso
borde "el técnico se equivocó y necesita revertir" manteniendo un rastro auditable.

**Atomicidad del stock (PENDIENTE DE DEFINIR):** registrar un repuesto usado decrementa
`repuestos.cantidad` y agrega a `repuestosUsados` del ticket en dos escrituras distintas. Sin
control de concurrencia, dos operaciones simultáneas pueden perder actualizaciones (lost update) y
corromper el conteo. Opciones a decidir antes de implementar: transacción de Mongoose (si el free
tier M0 la soporta), o update condicional (`updateOne` con filtro `cantidad >= n` y verificación del
resultado), o riesgo aceptado con reconciliación manual. Se registra también en ADR 0010.

## Alternativas consideradas

- **IDs secuenciales con slug ofuscado** — rechazado: el PRD exige explícitamente no-adivinable, y
  un slug corto sigue siendo débil frente a enumeración.
- **Modelo relacional con FKs (SQL)** — rechazado por la decisión MongoDB del ADR 0003; la
  jerarquía marcas→modelos→repuestos se garantiza por aplicación e índices.

## Consecuencias

- Un solo documento por ticket agrupa lo que el cliente y el técnico ven; lecturas simples.
- Trade-off: la consistencia de la jerarquía de inventario y la validación de referencias
  (`marcaId`, `modeloId`, `repuestoId`) deben mantenerse en el código de las API, no en la base.
- Trade-off: el tamaño del documento de ticket crece con notas e historial; aceptable para volúmenes
  de un negocio chico.

## Actualización (2026-09-23)

Se resuelve el punto pendiente de atomicidad del stock, implementado en el módulo `inventory` del
backend (`backend/src/inventory/`):

- El ajuste de `repuestos.cantidad` usa un **update condicional atómico** (`findOneAndUpdate` con
  `$inc` y un filtro `cantidad >= |delta|` cuando `delta` es negativo). Si el filtro no matchea
  (stock insuficiente), la operación no se aplica y la API devuelve `409 Conflict`. Se descarta la
  opción de transacción de Mongoose para no depender de su soporte en el free tier M0.
- Se agrega además: **borrado en cascada** al eliminar una marca o un modelo — elimina también sus
  modelos/repuestos hijos, replicando el comportamiento de las FKs `ON DELETE CASCADE` de la SQLite
  de la app de escritorio (`Invetario-Armalytech`), en vez de bloquear el borrado o dejar huérfanos.

## Actualización (2026-09-25): inventario v2

El local no solo guarda repuestos de reparación: también vende accesorios (parlantes, audífonos,
cargadores, cables tipo C / V8 / Lightning) y guarda micas, zócalos y pantallas que dependen del
modelo de celular. La jerarquía `marcas → modelos → repuestos` no representa bien ninguno de los dos
casos: un accesorio no pertenece a un modelo de celular, y una misma mica puede servir para varios
modelos (duplicarla por modelo desincroniza el stock). Esta actualización **reemplaza** el modelo de
inventario de la sección Decisión; el modelo de tickets se amplía más abajo y en el ADR 0007.

### Catálogo e inventario

- **marcas**: `{ _id, nombre }`. Las crea el usuario. Se usan tanto para celulares (Samsung) como
  para productos (JBL).
- **celulares**: `{ _id, marcaId, nombre }` (antes `modelos`). Es el catálogo de compatibilidad, no
  guarda stock.
- **categorias**: `{ _id, nombre }` — Pantallas, Micas, Zócalos, Cables, Cargadores, Parlantes,
  Audífonos, Repuestos. Se precargan y el usuario puede agregar más.
- **productos** (reemplaza a `repuestos`): `{ _id, categoriaId, marcaId?, nombre, modelo?, stock,
  costo, precioVenta, stockMinimo, compatibles: [celularId], activo, createdAt, updatedAt }`.
  `compatibles` es opcional: vacío para accesorios genéricos, con uno o más celulares para micas,
  zócalos, pantallas y repuestos.

### Movimientos, ventas y cobros

- **movimientosStock**: `{ _id, productoId, tipo, cantidad, stockResultante, referencia: { tipo,
  id }, motivo?, usuarioId, fecha }`, con `tipo` ∈ `venta | ticket_salida | ticket_devolucion |
  ajuste_entrada | ajuste_salida`. Todo cambio de stock escribe un movimiento (kardex); nada se
  borra. Si el conteo físico no coincide con el sistema, el historial muestra por qué.
- **ventas**: `{ _id, productoId, cantidad, precioUnitario, costoUnitario, metodoPago, usuarioId,
  fecha }`, con `metodoPago` ∈ `efectivo | yape`. El botón "Vender" descuenta stock, crea la venta,
  su movimiento y un cobro.
- **cobros**: `{ _id, origen: ticket | venta, referenciaId, titulo, descripcion, total, adelanto,
  saldo, metodoPago, costoPiezas, usuarioId, fecha }`. El Historial (ADR 0019) muestra los cobros
  del día como filas automáticas de solo lectura que suman al total junto con las filas manuales.
  Regla de uso: lo que entra por el panel no se vuelve a anotar a mano.
- Los botones +/− se conservan para ajustes (llegada de mercadería, rotura) y generan un movimiento
  `ajuste_*`.

### Atomicidad

Se mantiene el update condicional atómico (`$inc` con filtro `stock >= n`) por producto. Cuando una
operación descuenta varios productos (un ticket con dos piezas), se aplican en orden y, si uno falla
por stock insuficiente, se revierten los ya aplicados (compensación) y la API responde `409` con el
producto faltante. Los movimientos se escriben después de cada `$inc` exitoso.

### Buscador

Una sola caja de búsqueda en el inventario, reutilizada al elegir piezas en un ticket:

- Si el texto coincide con un celular ("A54"), muestra los productos compatibles agrupados por
  categoría, con stock y precio.
- Si no, busca por nombre, marca o modelo del producto ("cargador samsung", "tipo c").
- Filtros rápidos por categoría y por "stock bajo" (`stock <= stockMinimo`).

### Visibilidad

Por ahora todos los usuarios del panel son administradores y ven costo y ganancia. Cuando exista un
rol técnico (ADR 0022), se decide si el costo se oculta para ese rol.

### Datos existentes y descartes

- Los datos actuales de `marcas/modelos/repuestos` son de prueba: no se migran. El inventario v2
  arranca vacío y el script de migración desde SQLite (ADR 0008) queda sin uso para repuestos.
- Importar desde Excel: descartado por el usuario.

### Tickets (ampliación)

El documento de ticket agrega: `codigo` corto legible (`AT-000148`, secuencial por contador, para
hablar por teléfono; el enlace público sigue usando `publicToken`), `equipo: { marcaId, celularId,
color?, imei? }`, `fallaReportada`, `estadoIngreso` (daños visibles al recibir el equipo),
`diagnostico?`, `piezas: [{ productoId, nombre, cantidad, precioUnitario, costoUnitario, estado:
planificada | descontada | devuelta }]` (reemplaza a `repuestosUsados`), `manoDeObra`,
`precioTotal`, `adelanto`, `metodoPago?`, `tecnicoId`, `garantiaDias`. La clave o patrón de
desbloqueo nunca se guarda en el ticket ni aparece en el comprobante. Estados y flujo en el ADR
0007.