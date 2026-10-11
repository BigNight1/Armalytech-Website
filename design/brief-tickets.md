# Brief para Claude Design — Módulo de Tickets (panel ArmalyTech)

Pegá este texto en el mismo proyecto de Claude Design del rediseño del panel, para que use el mismo
sistema visual (Modernist con los colores de la marca, Archivo, esquinas rectas, reglas de 2px, menú
lateral azul marino, naranja #f97316 como color principal, rojo solo para errores, modo claro y oscuro).
Pantallas de escritorio a 1440px; el celular lo adaptamos nosotros.

## Contexto
Taller de reparación de celulares en Lima. El administrador recibe un equipo, arma un ticket, el cliente
aprueba el precio, el técnico repara y se entrega. El ticket está conectado al inventario (las piezas se
descuentan del stock al aprobar), a los clientes (fidelización de 5 sellos) y a la caja (adelanto y saldo).

Estados (en este orden): Pendiente → Aprobado → Trabajando → Listo → Entregado. Además: Cancelado y
Abandonado (7 días sin cambios; se oculta de la bandeja pero no se borra).

## Pantallas a diseñar

### 1. `/admin/tickets` — Bandeja
- Nuevo ítem "Tickets" en el menú lateral, grupo OPERACIÓN, con un contador de tickets activos.
- Encabezado "Tickets" + botón principal "Nuevo ticket".
- Chips de estado con contador (Todos, Pendiente, Aprobado, Trabajando, Listo, Entregado, Cancelado) y un
  interruptor "Mostrar abandonados".
- Buscador: celular, código (AT-000148), nombre, modelo o IMEI.
- Tabla: Código · Cliente (nombre + teléfono) · Equipo · Título · Estado (etiqueta de color por estado) ·
  Técnico · Ingreso · Total · Saldo · acciones.

### 2. Nuevo ticket — panel lateral derecho (640px), en 4 bloques
1. **Cliente:** teléfono (+51, 9 dígitos). Si existe: se autocompleta nombre y apellido, se ven sus
   sellos (x/5) y un aviso si tiene otro ticket en curso. Si no existe: campos nombre y apellido para
   crearlo ahí mismo.
2. **Equipo y problema:** marca + modelo del celular (del catálogo, con "Agregar celular"), color, IMEI
   opcional, falla reportada (texto), estado de ingreso (ej. "tapa rajada, sin chip").
   **Clave del equipo:** selector Sin bloqueo / PIN / Contraseña / Patrón. PIN y Contraseña = campo de
   texto; Patrón = grilla de 3×3 puntos donde se marca el orden. Aviso: "Se guarda cifrada y se borra al
   entregar".
3. **Piezas:** elegir categoría (Pantallas, Micas, Zócalos, Baterías…) + modelo (A53) → lista de
   productos compatibles con su disponibilidad: "Pantalla A53 OLED · stock 4 · 1 planificada en
   AT-000150". Si no queda disponible: fila bloqueada "Reservada para AT-000150 (María Quispe)". Botón
   agregar y cantidad. Nota: "Se descuentan del stock al aprobar".
4. **Precio y cierre:** título (autogenerado, editable: "Reparación de pantalla A53"), precio total
   acordado (un solo monto, ej. S/ 250), técnico (Martin Armas / Kevin Armas), adelanto (monto + Efectivo
   o Yape), saldo calculado, nota para el cliente (opcional). Pequeño bloque solo para el admin:
   "Costo de piezas S/ 120 · Ganancia S/ 130".
   Botón "Crear ticket".

### 3. Detalle del ticket — panel lateral o página
- Cabecera: código, título, etiqueta de estado, cliente, equipo, técnico.
- Línea de tiempo de estados con fecha y quién lo cambió.
- Botón principal según el estado (Aprobar / Empezar / Marcar listo / Entregar) + Cancelar.
  Aprobar: confirma el descuento de piezas. Entregar: pide el cobro del saldo (monto + Efectivo o Yape).
- Piezas con su estado (planificada / descontada / devuelta).
- Clave del equipo oculta con botón "Mostrar".
- Notas internas (solo panel) y nota para el cliente.
- Botones: "Enviar por WhatsApp" (link público de seguimiento) y "Ver comprobante".

### 4. Comprobante de servicio
Como el ejemplo ya aprobado: logo y dirección, "TICKET AT-000148", título, cliente, equipo, falla,
ingreso, entrega, técnico; una línea de servicio con el precio total, el adelanto (con método) y el
saldo (con método); garantía (30 días sobre la pieza cambiada, no cubre golpes, humedad ni equipos
abiertos por terceros); QR a la página pública; "Comprobante de servicio, no es boleta SUNAT".
Nunca muestra el costo de las piezas ni la clave del equipo.

### 5. `/admin/tecnicos` — Técnicos (solo owner, grupo ADMINISTRACIÓN)
Lista simple: nombre, estado activo/inactivo, tickets en curso, agregar y desactivar.
Datos de ejemplo: Martin Armas, Kevin Armas.

### 6. Detalle del cliente — pestaña nueva "Historial de servicios"
Dentro del panel lateral del cliente: lista de sus tickets (código, fecha, equipo, título, estado,
total) con acceso al detalle.

### 7. Historial de caja — filas de cobros
En la grilla del día, filas bloqueadas (candado, fondo distinto) "Adelanto AT-000148" y
"Saldo AT-000148" que suman a Efectivo o Yape y no se pueden editar.

## Estados vacíos y errores a incluir
Bandeja sin tickets, búsqueda sin resultados, pieza sin stock, cliente con ticket en curso, error al
aprobar por falta de stock ("Falta 1 Pantalla A53 OLED").
