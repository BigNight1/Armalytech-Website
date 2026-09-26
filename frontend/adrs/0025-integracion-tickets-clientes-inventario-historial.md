# ADR 0025: Integración Tickets, Clientes, Inventario e Historial de Caja

## Estado

Aceptado

## Contexto

El sistema contaba con módulos independientes diseñados en distintas etapas:
- **Comunidad / Clientes** (ADR 0012, 0013, 0018): registra clientes por QR/NFC, gestiona fidelización de 5 sellos y visitas en tienda, pero su drawer (`ClientDetailModal`) solo muestra historial de visitas, no el historial de reparaciones.
- **Inventario** (ADR 0006, 0008): almacena productos, repuestos, marcas y modelos de celular compatibles con stock físico y alertas de stock mínimo.
- **Tickets** (ADR 0006, 0007): define los 7 estados de servicio y el token público no adivinable, pero guardaba datos del cliente como texto plano sin clave foránea, sin búsqueda bidireccional por teléfono, y sin ligar repuestos específicos con stock al ticket.
- **Historial / Cierre de Caja** (ADR 0019): gestiona la hoja de balance diario (ingresos y gastos), pero los cobros de tickets requerían transcripción manual.

Para una operación de taller fluida y trazabilidad total, se requiere amarrar estos cuatro módulos en un flujo transaccional coherente.

## Decisión

### 1. Relación Unificada Cliente ↔ Tickets (Ficha 360°)

- Cada ticket almacena la referencia `clienteId: ObjectId` apuntando a la colección `clientes`, además de un snapshot `{ nombre, apellido, telefono }` para consultas rápidas y preservación histórica si el cliente cambia datos de contacto.
- **Historial en la Ficha del Cliente:** En el panel de Clientes (`/admin/clientes`), al abrir el Drawer de detalle del cliente (`ClientDetailModal`), se añade la pestaña **"Historial de Servicios / Tickets"**. Muestra el listado de todos los tickets asociados al cliente (`codigo`, `fechaIngreso`, `equipo`, `falla`, `estado`, `precioTotal`, botón para ver detalle del ticket).
- **Nuevo Ticket con Autocompletado:** En el formulario de creación de ticket (`/admin/tickets`), al tipear el número de teléfono (9 dígitos):
  - Si el cliente ya existe: autocompleta su nombre, muestra sus sellos de fidelización y advierte si tiene algún ticket en curso.
  - Si el cliente no existe: permite crearlo inmediatamente en la colección `clientes` con `visitas: 0` o `1` (unificando la base de datos).

### 2. Búsqueda y Vinculación Bidireccional

- En la bandeja de tickets (`/admin/tickets`), el buscador admite:
  - **Número de celular** (ej. `987654321` o `+51 987...`).
  - **Código de ticket** (ej. `AT-000148`).
  - **Nombre o apellido** del cliente.
  - **Modelo/Marca del equipo** o **IMEI / Nro de Serie**.
- La búsqueda es indexada en backend mediante índices compuestos en MongoDB (`codigo`, `cliente.telefono`, `cliente.nombre`, `equipo.modelo`, `equipo.imei`).

### 3. Conexión Ticket ↔ Inventario (Modelos, Repuestos y Cantidades)

- Un ticket técnico se compone de:
  - **Datos del equipo:** `marca`, `modelo`, `color`, `fallaReportada`, `clavePatron` (opcional), `imei` (opcional).
  - **Repuestos asignados (`repuestosUsados`):** Array de elementos con `{ repuestoId, nombre, marca, modeloCompatible, cantidad, costoUnitario, precioVentaUnitario }`.
  - **Mano de obra:** Campo numérico `{ manoDeObra: number }` (servicio técnico puro, sin descuento de stock físico).
  - **Valores monetarios:** `precioTotal = sum(repuestos.precioVenta * cantidad) + manoDeObra`, `adelanto: number` y `saldo = precioTotal - adelanto`.
- **Descuento de Stock Atómico:**
  - Al cambiar de estado a **`aprobado`**: el backend itera `repuestosUsados` y ejecuta operaciones atómicas de decremento (`$inc: { cantidad: -cant }`) con validación de existencia previa en inventario.
  - Al cambiar de estado a **`cancelado`**: el backend reintegra automáticamente las cantidades al stock (`$inc: { cantidad: +cant }`).
  - Cada modificación genera un registro en la colección de movimientos (Kardex) con tipo `salida_ticket` o `reingreso_ticket_cancelado` y referencia al código del ticket.

### 4. Amarrado al Historial de Caja (`cash-closings`)

- **Adelanto inicial:** Al crear o aprobar el ticket con `adelanto > 0`, se genera una fila de ingreso en la colección `cash-closings` de la fecha actual con:
  - `tipo: "ingreso"`, `categoria: "ticket_adelanto"`, `descripcion: "Adelanto Ticket AT-000148 - [Modelo]"`, `monto: adelanto`, `referenciaId: ticketId`.
- **Saldo final en Entrega:** Al marcar el ticket en estado **`entregado`**, se registra el cobro del `saldo` con categoría `ticket_saldo` y método de pago (Efectivo, Yape, Plin, Tarjeta).
- Estas filas aparecen en la grilla tipo Excel de `/admin/historial` marcadas como provenientes de tickets (bloqueadas para evitar desajustes accidentales).

### 5. Contratos de API (Endpoints)

- `GET /api/tickets?q=...&estado=...&clienteId=...&page=1&limit=20` (Listado y búsqueda con filtros)
- `POST /api/tickets` (Creación de ticket con cliente existente o nuevo)
- `GET /api/tickets/:id` (Detalle completo del ticket para panel)
- `PATCH /api/tickets/:id/status` `{ nuevoEstado, notaTecnica? }` (Transición de estado y disparo de eventos de stock/caja/WhatsApp)
- `PATCH /api/tickets/:id/repuestos` `{ repuestosUsados, manoDeObra }` (Ajuste de presupuesto y repuestos)
- `GET /api/tickets/public/:token` (Endpoint público sin auth para `/ticket/:token` del cliente)
- `GET /api/community/clients/:id/tickets` (Historial de tickets del cliente para el drawer)

## Alternativas consideradas

- **Mantener clientes como texto plano dentro del ticket:** Descartado; generaría duplicación de datos, errores tipográficos al buscar por celular y haría imposible que el cliente acumule sellos de fidelización por sus reparaciones.
- **Descontar stock apenas se recibe el equipo en "pendiente":** Descartado; si el cliente rechaza la cotización, se alteraría el stock físico de repuestos innecesariamente. Solo se reserva/descuenta en "aprobado".
- **Requerir doble registro manual en la caja:** Descartado; provoca descuadres frecuentes si el recepcionista olvida anotar el saldo cobrado en el Excel diario.

## Consecuencias

- **Positivas:**
  - Trazabilidad 360°: buscando un teléfono se sabe quién es el cliente, cuántas visitas tiene, qué teléfonos ha reparado antes y si tiene órdenes pendientes.
  - Inventario blindado: el stock refleja los repuestos físicos consumidos por los técnicos.
  - Cuadre de caja automático: los ingresos por servicio entran al balance del día sin error humano.
- **Trade-offs:**
  - Las transiciones de estado a `aprobado` y `cancelado` deben ser transaccionales o tolerantes a fallos (compensaciones si falla el descuento de un repuesto).
  - El formulario de nuevo ticket requiere debounce en la búsqueda de clientes por teléfono para no saturar el backend mientras el usuario escribe.

## Actualización (2026-09-25)

Decisiones del usuario que corrigen o completan este ADR para alinearlo con el ADR 0006 (actualización
inventario v2), el ADR 0007 y el código ya construido. Donde difieran, manda esta sección.

1. **Inventario v2, no el modelo viejo.** El ticket referencia **productos** (`productoId`) y descuenta
   `productos.stock`, no `repuestos.cantidad`. El arreglo del ticket se llama `piezas: [{ productoId,
   nombre, categoria, cantidad, costoUnitario, estado: planificada | descontada | devuelta }]`. Los
   movimientos usan los tipos ya implementados `ticket_salida` y `ticket_devolucion` (no
   `salida_ticket` / `reingreso_ticket_cancelado`).
2. **Disponibilidad y reservas.** Disponible = `stock − cantidades planificadas en otros tickets en
   pendiente`. Al elegir una pieza se muestra "stock 4 · 1 planificada en AT-000150". Si el disponible
   es 0, la pieza aparece bloqueada con "Reservada para AT-000150 (nombre del cliente)". El descuento
   real sigue ocurriendo solo al pasar a `aprobado` (update condicional atómico, 409 si falta) y se
   devuelve al cancelar o al volver de `aprobado` a `pendiente`.
3. **Flujo del formulario Nuevo ticket:** (a) cliente por teléfono (autocompleta o crea), (b) equipo
   (celular del catálogo; se puede crear ahí mismo) + falla reportada + estado de ingreso + clave del
   equipo, (c) piezas: el admin elige categoría y modelo, ve disponibilidad y agrega, (d) precio total
   acordado, técnico, adelanto con método, título (autogenerado y editable, ej. "Reparación de
   pantalla A53").
4. **Precio: total acordado, sin mano de obra.** Se elimina `manoDeObra`. El admin escribe
   `precioTotal` (lo acordado con el cliente). `saldo = precioTotal − adelanto`. El costo de las piezas
   (`costoUnitario`) se guarda para calcular la ganancia del ticket, visible solo en el panel; nunca en
   el comprobante, la página pública ni WhatsApp. El comprobante muestra una sola línea de servicio
   (título + precio total), el adelanto y el saldo.
5. **Cobros en colección aparte (no filas en `cash-closings`).** Colección `cobros`: `{ origen: ticket |
   venta, referenciaId, tipo: adelanto | saldo | venta, monto, metodo: efectivo | yape, fecha,
   usuarioId }`. El adelanto se registra al crear o aprobar con `adelanto > 0`; el saldo al pasar a
   `entregado`. El Historial muestra los cobros del día como filas de solo lectura ("Adelanto
   AT-000148", "Saldo AT-000148") que suman a la columna de efectivo o Yape. Solo efectivo y Yape.
6. **Clave del equipo.** `claveEquipo: { tipo: ninguno | pin | contrasena | patron, valor }`. El patrón
   se captura en una grilla 3×3 y se guarda como secuencia de puntos (ej. `1-5-9-6`). Se guarda
   **cifrada** (AES-256-GCM, clave `TICKET_SECRET_KEY` en el entorno), solo se muestra en el detalle del
   ticket del panel tras "Mostrar", nunca en la vista pública, el comprobante ni WhatsApp, y **se borra
   automáticamente** al pasar a `entregado` o `cancelado`. Reemplaza a `clavePatron` y deja sin efecto la
   frase del ADR 0006 "nunca se guarda": se guarda cifrada y temporalmente porque el técnico la
   necesita para probar pantalla, cámara, etc.
7. **Equipo enlazado al catálogo.** `equipo: { marcaId, celularId, color?, imei? }` (catálogo de
   celulares del inventario v2) más un snapshot de nombres para búsqueda e historial.
8. **Textos para el cliente.** Campos separados: `titulo`, `notaCliente` (visible en la página pública)
   y `notasInternas` (solo panel). La vista pública `/ticket/:token` ya consume `titulo`.
9. **Sello al entregar.** Pasar a `entregado` suma 1 sello de fidelización al cliente (misma lógica que
   "+1 Visita", incluido el aviso del 4.º sello si tiene consentimiento).
10. **Técnicos.** Nueva colección `tecnicos: { nombre, activo }` gestionada por el owner en una sección
    "Técnicos" (Administración). Semilla: Martin Armas y Kevin Armas. No son usuarios del panel. El
    ticket guarda `tecnicoId` y el nombre como snapshot; el comprobante muestra el técnico.
11. **Endpoints ajustados:** `PATCH /api/tickets/:id/piezas` `{ piezas, precioTotal }` (reemplaza
    `/repuestos` con `manoDeObra`); `GET /api/tickets/availability?categoriaId&celularId` devuelve
    productos con `stock`, `planificado` y los tickets que los reservan; `PATCH /api/tickets/:id/status`
    `{ nuevoEstado, cobro?: { monto, metodo } }` (el cobro del saldo va con `entregado`);
    `GET|POST|PATCH /api/technicians`; `POST /api/tickets/:id/reveal-clave` (auditado) devuelve la clave
    descifrada.
