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