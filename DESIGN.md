# Design.md — Sistema visual y decisiones de diseño

Este documento describe **cómo se ve y se comporta ArmalyTech** en sus tres contextos de producto (sitio público, panel administrativo y página pública de ticket) y **por qué** se decidió así. Es el eslabón intermedio del pipeline documental del repo: parte de [PRD.md](PRD.md), alimenta [TECH-DESIGN.md](TECH-DESIGN.md) y se materializa en los tokens y componentes de `frontend/src/`.

## 1. Propósito y alcance

**Qué decide.** El sistema visual con los valores reales que están en el código (paleta, tipografía, escala, espaciado, radios, sombras, bordes); el inventario de componentes compartidos y sus variantes reales; los patrones de layout de cada superficie y sus reglas de adaptación; cómo se representan los estados del ticket y todo el feedback del sistema (carga, vacío, error, éxito, confirmaciones destructivas); y la trazabilidad de las decisiones, incluidas las tensiones que se resolvieron a mitad de camino.

**Qué no decide.** Arquitectura, capas, contratos de API, modelo de datos, autenticación y despliegue: eso es [TECH-DESIGN.md](TECH-DESIGN.md) y [docs/adrs/](docs/adrs/). Requisitos y alcance: [PRD.md](PRD.md). Detalle por feature: [odd/tasks/](odd/tasks/).

**Cómo se lee.** Cada afirmación tiene fuente verificable: un archivo del repo enlazado. Los valores de color y tipografía salen de los tres archivos de tokens y de `tailwind.config.js`; las variantes, de los `.jsx`; las decisiones, de ADR y `odd/tasks`. Cuando algo es una observación sobre el código actual y no una decisión tomada, se dice explícitamente.

---

## 2. Principios de diseño

**P1 · Un solo sistema, tres superficies, con jerarquía declarada.** El panel y la página de ticket comparten lenguaje visual, pero cada superficie tiene su archivo de tokens y **ninguno toca `body` ni `:root`**: `--admin-*` vive bajo `.admin-shell` ([tokens.css](frontend/src/admin/shared/theme/tokens.css)) y `--tk-*` bajo `.ticket-page` ([tokens.css](frontend/src/ticket/theme/tokens.css)). El sitio público conserva sus estilos globales intactos. *Verificable:* el bundle público no arrastra tokens del panel.

**P2 · La estructura la dibujan las reglas, no los adornos.** El sistema adoptado es el "Modernist" del prototipo: radio 0, divisores de 2 px, sin decoración y con etiquetas a la izquierda ([readme del DS](<design/panel-admin/Rediseño panel administrativo/_ds/modernist-4f88adac-ccf9-4434-bae3-42bfb4042a46/readme.md>)). *Verificable:* en todo `src/admin/` solo hay dos usos de `rounded-*` — el círculo del spinner y un `rounded-none` explícito ([CobroDetailModal.jsx](frontend/src/admin/cash-closings/components/CobroDetailModal.jsx)) — y una sola sombra de elevación (`shadow-admin-lg`), reservada a overlays y popovers.

**P3 · El naranja es una señal, no un fondo.** El acento `#f97316` rellena solo la acción primaria, la pestaña activa, el paso en curso del tracker y la etiqueta "En taller". Para texto naranja se usa `accent-ink` (`#c2410c` en claro, `#fdba74` en oscuro), porque el acento no alcanza para texto de párrafo — la propia guía del design system lo advierte. *Verificable:* `text-accent` sin sufijo aparece dos veces en el panel, ambas sobre `bg-ink` en los sellos de fidelización ([LoyaltyStamps.jsx](frontend/src/admin/clients/components/LoyaltyStamps.jsx)).

**P4 · La etiqueta del estado la elige la audiencia, no la base de datos.** `trabajando` es **"En taller"** en el panel ([TicketStatusBadge.jsx](frontend/src/admin/tickets/components/TicketStatusBadge.jsx)) y **"Trabajando"** en la página del cliente ([ticketPresenter.js](frontend/src/ticket/lib/ticketPresenter.js)); `listo` es "Listo" y "Listo para recoger". Los estados internos se traducen dos veces, con dos vocabularios.

**P5 · Lo que ve el cliente y lo que ve el técnico son documentos distintos.** Costo de piezas, ganancia, notas internas y clave del equipo no cruzan al lado público; lo exclusivo del panel se marca como **"Solo panel"** ([NewTicketDrawer.jsx](frontend/src/admin/tickets/components/NewTicketDrawer.jsx)). El comprobante lo dice con palabras: *"Comprobante de servicio técnico, no constituye comprobante de pago SUNAT"*.

**P6 · Ningún estado vacío deja al usuario sin salida.** Todo vacío tiene título, explicación y una acción o un canal de contacto: `EmptyState` con botón en la bandeja, `TicketNotFound` y `TicketClosedBanner` con WhatsApp en la página pública.

---

## 3. Sistema visual

### 3.1 Los tres contextos (más una superficie derivada)

| Contexto | Raíz / clase | Tema | Tipografía | Radio | Densidad |
|---|---|---|---|---|---|
| Sitio público | Tailwind + CSS por sección en `src/Components/*.css` | Solo oscuro (hero navy) | Inter en secciones, Nunito en pasos/contacto, Plus Jakarta en Redes | Mixto, heredado | Secciones a 10/6/3 rem según breakpoint ([index.css](frontend/src/index.css)) |
| Panel `/admin/*` | `.admin-shell` | Claro (por defecto) y oscuro | Archivo 400/600/800 | 0 | Densa: cuerpo 15 px, celdas 8 px verticales |
| Ticket público `/ticket/:token` | `.ticket-page` | **Solo claro** | Archivo 400/600/800 | 0 | Media: bloques de 22–36 px |
| Registro QR/NFC `/registrar/usuario` | Tailwind + `brand.*` | Solo oscuro (navy) | Archivo | Redondeado (tarjeta tipo club) | Móvil primero, 430 px |

La página de ticket es solo clara por decisión del tablero original ("solo modo claro"), registrada en la cabecera de [tokens.css](frontend/src/ticket/theme/tokens.css). El registro por QR/NFC es la excepción declarada a P2: usa `rounded-xl`/`rounded-full` y una tarjeta de sellos con degradado, porque su referente es una tarjeta de fidelización física y no una pantalla de trabajo ([LoyaltyCard.jsx](frontend/src/community/components/LoyaltyCard.jsx)).

### 3.2 Paleta

**Acento (idéntico en claro y oscuro, como en el prototipo).**

| Token | Valor | Uso |
|---|---|---|
| `--admin-accent-100` | `#ffedd5` | Etiquetas suaves ("Aprobado"), hover de ghost |
| `--admin-accent-200` | `#fed7aa` | Activo del ghost |
| `--admin-accent-300` | `#fdba74` | "Panel" del sidebar; texto sobre navy en oscuro |
| `--admin-accent-400` | `#fb923c` | Paso intermedio del ramp |
| `--admin-accent-500` | `#f97316` | **Base**: primario, pestaña activa, "En taller" |
| `--admin-accent-600` | `#ea580c` | Hover del primario |
| `--admin-accent-700` | `#c2410c` | Pressed del primario |
| `--admin-accent-800` | `#9a3412` | Texto sobre tintes claros |
| `--admin-accent-900` | `#7c2d12` | Texto sobre `accent-100` |
| `--admin-on-accent` | `#0f172a` | Tinta sobre relleno naranja (fija, no depende del tema) |

**Superficies y tinta del panel** ([tokens.css](frontend/src/admin/shared/theme/tokens.css)).

| Rol | Claro | Oscuro | Tailwind |
|---|---|---|---|
| Fondo de página | `#f8fafc` | `#0f172a` | `bg-bg` |
| Superficie (inputs, totales, tarjetas) | `#eef2f7` | `#1e293b` | `bg-surface` |
| Tinta principal | `#0f172a` | `#e2e8f0` | `text-ink` |
| Tinta secundaria | `#475569` | `#94a3b8` | `text-muted` |
| Divisor | `rgba(15,23,42,.2)` | `rgba(226,232,240,.2)` | `border-line` |
| Hover de fila | `rgba(15,23,42,.05)` | `rgba(226,232,240,.06)` | `bg-row-hover` |
| Peligro | `#dc2626` | `#ef4444` | `bg-danger` |
| Fondo de peligro | `#fef2f2` | `rgba(239,68,68,.14)` | `bg-danger-bg` |
| Tinta de peligro | `#b91c1c` | `#fca5a5` | `text-danger-ink` |
| Tinta de acento | `#c2410c` | `#fdba74` | `text-accent-ink` |

**El sidebar es siempre navy, en ambos temas.** No usa los tokens que cambian con el tema (`side.*` en [tailwind.config.js](frontend/tailwind.config.js)): fondo `#0f172a` en claro y `#020617` en oscuro, popover `#1e293b`/`#0f172a`, tinta `#e2e8f0`, muted `#94a3b8`, hover `rgba(226,232,240,.08)`, activo `rgba(249,115,22,.16)` con tinta `#fdba74`, divisor `rgba(226,232,240,.12)`. El comentario de [Sidebar.jsx](frontend/src/admin/shared/layout/Sidebar.jsx) explica por qué el badge "Owner" no usa el `Tag` compartido: este resuelve colores que cambian de tema y el sidebar no.

**Página de ticket** ([tokens.css](frontend/src/ticket/theme/tokens.css)): subconjunto del panel en claro — `--tk-accent-100/500/600`, `--tk-accent-ink #c2410c`, `--tk-on-accent #0f172a`, `--tk-bg #f8fafc`, `--tk-surface #eef2f7`, `--tk-text #0f172a`, `--tk-muted #475569`, `--tk-divider rgba(15,23,42,.2)`, `--tk-divider-soft rgba(15,23,42,.12)` (solo esqueletos), `--tk-danger #dc2626` / `#fef2f2` / `#b91c1c`.

**Sitio público.** `brand.orange` (`#f97316` base; `50 #fff7ed`, `100 #ffedd5`, `300 #fdba74`, `600 #ea580c`, `700 #c2410c`), `brand.navy` (`#0f172a`, claro `#1e293b`, oscuro `#020617`) y `brand.ink` (`#e2e8f0`) en [tailwind.config.js](frontend/tailwind.config.js), más un hero propio: `linear-gradient(180deg,#0f172a 0%,#020617 50%,#0f172a 100%)` con retícula de puntos a 24 px y rayas a 45° ([index.css](frontend/src/index.css)). **Excepción detectada:** el CTA del menú móvil usa `#ff5a2a`/`#e54e1f`, fuera del ramp de marca ([navbar.css](frontend/src/Components/Navbar/navbar.css)).

### 3.3 Tipografía

| Rol | Valor | Fuente |
|---|---|---|
| Familia (panel y ticket) | Archivo 400/600/800, por `<link>` en [index.html](frontend/index.html) | `'Archivo', system-ui, sans-serif` |
| Cuerpo | 15 px / 1.55 | `.admin-shell`, `.ticket-page` |
| h1 / h2 / h3 / h4 | 42 / 32 / 25 / 20 px, peso 800, tracking `-0.015em` | `tokens.css` |
| Altura de línea de titulares | 1.12 en panel, 1 en ticket | `tokens.css` |
| Códigos y cifras | `font-mono` + `tabular-nums` (`AT-000148`, IMEI, montos, cantidades) | tablas y drawers |
| Sitio público | Inter (secciones), Nunito (pasos, contacto), Plus Jakarta Sans (Redes) | `src/Components/*.css` |

Escala observada en componentes: 11, 12, 13, 15, 17, 20, 22, 25, 26, 30, 32, 34, 40, 42, 52, 64, 80 px. Las etiquetas de dato (kicker de sección, cabecera de tabla, métrica) son **13 px, peso 600–800, mayúsculas, tracking `.06–.18em`**: es el recurso tipográfico que reemplaza a la decoración.

### 3.4 Escala, espaciado y medidas

No hay tokens de espaciado: el ritmo 4/8/12/16/24/32 del prototipo se expresa con utilidades Tailwind (`gap-1`…`gap-8`, `p-3.5`, `py-2.5`) y algunos valores exactos en clases arbitrarias. Medidas que sí son contrato:

| Medida | Valor | Dónde |
|---|---|---|
| Sidebar | 264 px fijo en `lg`+; drawer off-canvas por debajo | [AdminLayout.jsx](frontend/src/admin/shared/layout/AdminLayout.jsx) |
| Header del panel | 76 px, borde inferior 2 px | [Header.jsx](frontend/src/admin/shared/layout/Header.jsx) |
| Contenido | `px-4 py-6` → `sm:px-6` → `lg:px-10 lg:py-8` | `AdminLayout.jsx` |
| Drawer lateral | 640 px máximo, borde izquierdo 4 px de acento, cabecera 80 px | [NewTicketDrawer.jsx](frontend/src/admin/tickets/components/NewTicketDrawer.jsx) |
| Diálogos | `sm` 500 / `md` 620 / `lg` 640 / `xl` 820 px; sin `size`, 512 px | [Modal.jsx](frontend/src/admin/shared/ui/Modal.jsx) |
| Confirmación de descarte | 420 px, `z-60` | [DiscardChangesDialog.jsx](frontend/src/admin/shared/ui/DiscardChangesDialog.jsx) |
| Inputs / selects | 42 px (`md`), 46 px (`lg`), 50 px (`xl`) | [Input.jsx](frontend/src/admin/shared/ui/Input.jsx) |
| Botones | `px-4 py-2.5`; icono 34×34; 46 px de alto en pies de drawer | [Button.jsx](frontend/src/admin/shared/ui/Button.jsx) |
| Tabla del panel | `th` 13 px mayúsculas con borde inferior 2 px; `td` 8 px verticales | `.admin-table` en `tokens.css` |
| Padding de overlays | `px-4 sm:px-7`, nunca `px-7` fijo | [responsive-panel.md](odd/tasks/responsive-panel.md) |
| Página de ticket | `max-w-[1280px]`, hero `7fr / 5fr`, gutter `gap-6 lg:gap-12` | [TicketPage.jsx](frontend/src/ticket/TicketPage.jsx) |
| Registro QR/NFC | `max-w-[430px]`, campos de 50 px, CTA de 56 px | [RegisterPage.jsx](frontend/src/community/RegisterPage.jsx) |

### 3.5 Radios, sombras y bordes

- **Radio 0** en panel y ticket. `rounded-full` solo en el spinner y en el punto de estado del hero; los esqueletos públicos usan `rounded`, que suaviza el rectángulo sin convertirlo en tarjeta.
- **Sombras:** una sola en el panel, `--admin-shadow-lg` (`0 16px 40px rgba(15,23,42,.2)` en claro; `0 0 0 1px rgba(226,232,240,.08), 0 18px 44px rgba(0,0,0,.55)` en oscuro), expuesta como `shadow-admin-lg` y reservada a modales, drawers, popovers y toasts. La página pública no usa sombras: la jerarquía la dan los bordes.
- **Bordes:** 1 px para el contorno de controles, **2 px** para divisores estructurales (header, secciones, cabecera de tabla, caja de precios) y **4 px** para el borde de acento del drawer y el borde superior de los diálogos.
- **Foco:** `outline: 2px solid var(--admin-accent); outline-offset: 2px` en `.admin-shell`, equivalente con `--tk-accent-500` en `.ticket-page`. Nunca el anillo azul del navegador.

---

## 4. Componentes compartidos

Todo el panel importa desde `../shared/ui/index.js`; no se reimplementan controles. La tabla lista las variantes que existen en el código, no las que "deberían" existir.

| Componente | Propósito | Archivo | Variantes / props reales |
|---|---|---|---|
| `Button` | Acción | [Button.jsx](frontend/src/admin/shared/ui/Button.jsx) | `primary`, `secondary`, `ghost`, `danger`, `icon` (34×34); etiqueta a la izquierda, no centrada |
| `Input` | Campo de texto con label y error | [Input.jsx](frontend/src/admin/shared/ui/Input.jsx) | `size` `md`/`lg`/`xl`; `endAdornment` (ojo de contraseña) |
| `NumberInput` | Entrada numérica | [NumberInput.jsx](frontend/src/admin/shared/ui/NumberInput.jsx) | Envoltura de `Input` con `inputMode="decimal"` |
| `Select` | Desplegable nativo | [Select.jsx](frontend/src/admin/shared/ui/Select.jsx) | `size` `md`/`lg`/`xl`, mismas alturas que `Input` |
| `Modal` | Overlay de diálogo o drawer | [Modal.jsx](frontend/src/admin/shared/ui/Modal.jsx) | `variant` `dialog`/`drawer`; `size`; `bordered`; `tone` `accent`/`danger`; `header` (o `header={null}`); `dismissible`; `isDirty` |
| `ConfirmDialog` | Confirmación destructiva | [ConfirmDialog.jsx](frontend/src/admin/shared/ui/ConfirmDialog.jsx) | `danger` (por defecto) o `accent`; `icon` (`TriangleAlert` en caja 44×44); sin fila de cabecera |
| `DiscardChangesDialog` | Confirmar pérdida de datos | [DiscardChangesDialog.jsx](frontend/src/admin/shared/ui/DiscardChangesDialog.jsx) | `alertdialog` a `z-60`, foco inicial en "Seguir editando" |
| `useUnsavedGuard` | Lógica de cierre con guardia (no UI) | [useUnsavedGuard.js](frontend/src/admin/shared/ui/useUnsavedGuard.js) | Usado por `Modal` y por los tres drawers propios |
| `EmptyState` | Lista/tabla vacía | [EmptyState.jsx](frontend/src/admin/shared/ui/EmptyState.jsx) | `title`, `description`, `action`; borde discontinuo |
| `Spinner` | Carga de una acción puntual | [Spinner.jsx](frontend/src/admin/shared/ui/Spinner.jsx) | `sm`/`md`/`lg`; `role="status"` + `aria-label="Cargando"` |
| `Skeleton`, `SkeletonTable`, `SkeletonRows` | Carga inicial con forma de contenido | [Skeleton.jsx](frontend/src/admin/shared/ui/Skeleton.jsx) | Filas y columnas configurables |
| `Tag` | Etiqueta estática | [Tag.jsx](frontend/src/admin/shared/ui/Tag.jsx) | `neutral`, `accent`, `solid`, `danger` |
| `Chip` | Píldora de filtro clicable | [Chip.jsx](frontend/src/admin/shared/ui/Chip.jsx) | `active` booleano (no `variant`); alto 36 px |
| `DatePicker`, `DateRangePicker` | Fecha y rango | [DatePicker.jsx](frontend/src/admin/shared/ui/DatePicker.jsx), [DateRangePicker.jsx](frontend/src/admin/shared/ui/DateRangePicker.jsx) | `aria-label` "Elegir fecha" / "Elegir rango de fechas" |
| `ToastProvider`, `useToast` | Notificaciones no bloqueantes | [ToastProvider.jsx](frontend/src/admin/shared/ui/ToastProvider.jsx) | `info`, `success`, `error`; 4 000 ms; deduplica repetidos |

Fuera de `shared/ui/` pero con el mismo estatus de patrón: `.admin-table` (en `tokens.css`), `.btn`/`.btn-primary`/`.btn-secondary` ([index.css](frontend/src/index.css)) para pies de drawer, y `TicketStatusBadge`, el badge de estado de ticket que también consume la ficha del cliente — la importa desde `tickets/` ([ClientTicketsTab.jsx](frontend/src/admin/clients/components/ClientTicketsTab.jsx)).

---

## 5. Patrones de layout

### 5.1 Sitio público

Hero navy a pantalla completa con retícula y rayas de fondo, tres columnas en escritorio (texto · imagen · prueba social) que colapsan a una en móvil; secciones con padding vertical muy generoso (`10rem` en escritorio) y CTA naranja como único punto de color saturado ([Hero.jsx](frontend/src/Components/Hero.jsx)). La navegación móvil es un overlay a pantalla completa en `#111827`, no un desplegable.

### 5.2 Panel: sidebar fijo, header de orientación, contenido denso

- Sidebar de 264 px con bloque de marca (logo 38 px + "Panel"), navegación agrupada en **Operación** (Inventario, Tickets / Taller, Historial del día, Clientes) y **Administración** (Personal, Técnicos — solo `owner`, con badge "Owner"), y bloque de usuario al pie que abre un popover con Perfil / Configuración / Modo oscuro / Cerrar sesión ([Sidebar.jsx](frontend/src/admin/shared/layout/Sidebar.jsx)).
- Header de 76 px con breadcrumb "Panel / Sección / Subsección", reloj de Lima (oculto en móvil) y botón de tema de 42×42; por debajo de `lg` el sidebar es off-canvas y aparece el botón hamburguesa.
- Cada página de feature repite la retícula: kicker de sección en mayúsculas naranja + `h1`, acción primaria a la derecha, franja de métricas separada por reglas de 2 px, barra de pestañas con buscador integrado, y tabla o estado vacío ([TicketsPage.jsx](frontend/src/admin/tickets/TicketsPage.jsx)).
- Precarga al pasar el mouse o enfocar un ítem del sidebar (chunk + primera consulta), para que el clic no muestre esqueleto.

### 5.3 Drawer "Nuevo ticket" (640 px, cuatro bloques)

Un solo formulario largo, no un asistente: los cuatro pasos son **anclas a secciones** con una barra de 4 columnas numeradas `01`–`04` que además indica en qué bloque está el usuario ([NewTicketDrawer.jsx](frontend/src/admin/tickets/components/NewTicketDrawer.jsx)). Orden real: **Cliente → Equipo → Precio y cierre → Piezas**. La validación hace scroll al bloque que falló y muestra un único banner de error arriba. Detalles que sostienen el flujo: teléfono con prefijo `+51` fijo y sello "Encontrado"/"Cliente nuevo" en el mismo control; tarjeta de cliente con iniciales, visitas y sellos, más banner naranja si ya tiene un ticket en curso; clave como control segmentado de 4 opciones y patrón dibujable en cuadrícula 3×3 con el orden escrito; adelanto con dos métodos (Efectivo / Yape) y saldo calculado en una caja de 32 px; franja "Solo panel" con costo y ganancia (roja si es negativa); piezas bloqueadas con candado ("Reservada para AT-000150"); pie fijo con total y botón de creación.

### 5.4 Drawer "Detalle del ticket"

Cabecera con código, título, badge y acciones; cuerpo con **línea de tiempo de 5 columnas** (Recepcionado → Aprobado → En taller → Listo → Entregado) con fecha y usuario por paso, **caja de precios de 3 columnas** (total, adelanto con método, saldo con método), franja "Solo panel", falla y estado de ingreso, piezas con su estado, notas internas y nota para el cliente ([TicketDetailDrawer.jsx](frontend/src/admin/tickets/components/TicketDetailDrawer.jsx)). La acción primaria cambia con el estado; las transiciones laterales viven en un menú "Cambiar estado" anclado a la izquierda con ancho limitado por viewport (corrección explícita de la QA responsive) y "Cancelar ticket" es un botón de peligro separado.

### 5.5 Página pública de ticket

Composición editorial: cabecera `7fr / 5fr` con breadcrumb "Inicio / Mi ticket / AT-000148", titular a 80 px con punto naranja y una nota que explica que el enlace es privado y no requiere contraseña; debajo, el **hero de estado** (7fr) con la grilla de 6 datos (5fr) en 2×3; después el tracker de 3 pasos o el banner de cierre; al final el bloque de contacto en dos columnas con dirección, horario y WhatsApp ([TicketView.jsx](frontend/src/ticket/components/TicketView.jsx)). Reutiliza el `Navbar` y el `Footer` reales del sitio, no un chrome propio, y se marca `noindex`.

### 5.6 Registro por QR/NFC

Pantalla de móvil a 430 px, navy, sin navbar ni footer, con tarjeta de sellos arriba y formulario corto (nombre, apellido, WhatsApp con `+51`, consentimiento **opcional**) más cuatro beneficios con icono. El canal `qr`/`nfc` viaja por query param y no se muestra al usuario ([RegisterPage.jsx](frontend/src/community/RegisterPage.jsx)). Es la única superficie con lenguaje "tarjeta", justificado por el objeto físico que la origina.

### 5.7 Comprobante de servicio

Diálogo de 500 px sobre papel blanco (aunque el panel esté en oscuro), con cabecera navy, datos del local, `TICKET AT-000148` a 24 px, grilla de cliente/equipo/falla/técnico/fecha, línea de servicio (total, adelanto con método, saldo o total cancelado), bloque de garantía, QR de 80 px con el enlace de seguimiento y la leyenda de que no es boleta SUNAT. Nunca muestra costo de piezas ni clave del equipo.

---

## 6. Estados y feedback

### 6.1 Los siete estados y su doble representación

El modelo tiene 7 estados (ADR 0007, actualización 2026-09-25); el seguimiento público tiene 3 pasos.

| Estado | Badge en panel | Etiqueta pública | Tono del hero | Paso del tracker | Acción primaria en el drawer |
|---|---|---|---|---|---|
| `pendiente` | Pendiente (contorno, muted) | Pendiente | `neutral` (superficie) | 01 Pendiente | Aprobar (confirma descuento de piezas) |
| `aprobado` | Aprobado (`accent-100` + `accent-900`) | Aprobado | `neutral` | 01 Pendiente | Empezar reparación |
| `trabajando` | **En taller** (`accent` + `on-accent`) | Trabajando | `accent` (naranja, punto animado) | 02 Trabajando | Marcar como listo |
| `listo` | Listo (contorno de acento, `accent-ink`) | **Listo para recoger** | `dark` (navy) | 03 Listo | Entregar y cobrar saldo |
| `entregado` | Entregado (contorno, muted) | Entregado | `dark` | 03 Listo, completado | — (solo comprobante) |
| `cancelado` | Cancelado (`danger-bg`) | Cancelado | `danger` | **sin tracker** | Reabrir (a `pendiente`) |
| `abandonado` | Abandonado (`danger-bg`) | **Sin actividad** | `muted` | **sin tracker** | Entregar / Cancelar |

### 6.2 Cómo se resolvió el desajuste 3 ↔ 7

El tablero de la página pública modelaba **3 estados** (`pendiente` / `trabajando` / `finalizado`), cada uno con su color de hero. El producto terminó con **7**. La solución, en [ticketPresenter.js](frontend/src/ticket/lib/ticketPresenter.js), fue agrupar el camino principal en las 3 columnas del diseño (`pendiente` y `aprobado` → grupo 0; `trabajando` → 1; `listo` y `entregado` → 2) y sacar del tracker los dos estados que no son puntos de la línea de tiempo: `cancelado` y `abandonado` muestran un **banner de cierre** con su tinta y un texto que dice qué hacer ([TicketClosedBanner.jsx](frontend/src/ticket/components/TicketClosedBanner.jsx)). Efecto secundario asumido: "Aprobado" no tiene paso propio en la página del cliente; se comunica con el copy del hero ("Aprobaste el presupuesto") y con la fecha del paso 01. En el panel no se agrupa nada: la línea de tiempo tiene 5 columnas y los 7 estados se ven en el badge.

### 6.3 Carga

El panel usa esqueleto con forma de tabla, no spinner, en la primera carga (`SkeletonTable` de 6 filas × 7 columnas en la bandeja); `Spinner` queda para acciones puntuales dentro de un botón. La página de ticket usa `TicketSkeleton`, que reproduce la retícula completa (cabecera, hero + 6 celdas, 3 columnas) con `role="status"` y `aria-label="Cargando ticket…"`. Las búsquedas dentro de formularios usan texto plano ("Buscando repuestos en inventario…"), porque el bloque es corto.

### 6.4 Vacío

Bandeja sin tickets: `EmptyState` con título, explicación que cambia según haya filtro o búsqueda, y botón "Crear nuevo ticket". Búsqueda sin resultados: el mismo componente con el texto de "no coinciden con la búsqueda". Piezas sin coincidencias: una línea en itálica dentro de la lista, sin ilustración. Token inválido o desconocido: `TicketNotFound`, con la etiqueta "Enlace no encontrado", un titular, una explicación tranquilizadora y el botón de WhatsApp — no una página de error técnica.

### 6.5 Error

Error de formulario: un único banner arriba del cuerpo, con icono de alerta, borde y fondo de peligro, y un mensaje que nombra el campo ("Ingresa el PIN.", "Dibuja el patrón (mínimo 4 puntos)."); el formulario hace scroll al bloque culpable. Error de negocio con datos: al aprobar sin stock el drawer abre un diálogo propio con el desglose de faltantes (`Falta 1 Pantalla A53 OLED`) en lugar de un toast genérico; el toast se reserva para errores sin estructura. Conflicto de concurrencia: aviso de información ("El ticket cambió, recargando") y recarga. Consulta pública fallida: se trata como "no encontrado" (404, red o 5xx), por decisión de producto.

### 6.6 Éxito

Siempre por toast, no por banner dentro de la página: `"Ticket creado: AT-000148"`, `"El ticket AT-000148 ahora está en: Listo"`, `"Se guardaron los cambios del taller."`. Reglas del componente: 4 s por defecto, un mensaje repetido no se apila, y el contenedor usa `role="status"` para que el lector de pantalla lo anuncie sin robar el foco.

### 6.7 Confirmaciones destructivas

Dos niveles con propósitos distintos. **`ConfirmDialog`** (500 px, icono en caja tintada, sin cabecera separada) para borrar, desactivar, anular un cobro o cancelar un ticket: el botón de peligro es sólido y el de cancelar es ghost. **`DiscardChangesDialog`** (420 px, `z-60`, `role="alertdialog"`) cuando se intenta cerrar un formulario con datos: Esc y clic en el fondo equivalen a **"Seguir editando"**, y ese botón recibe el foco inicial, de modo que nunca se descarta por accidente.

---

## 7. Responsive y accesibilidad

### 7.1 Lo que se verificó de verdad

El trabajo de responsive está documentado con evidencia en [responsive-panel.md](odd/tasks/responsive-panel.md):

- **Causa raíz corregida:** la columna de contenido era un flex item sin `min-w-0`, así que crecía hasta la tabla más ancha y anulaba los `overflow-x-auto`; la página se desplazaba en horizontal y el fondo oscuro terminaba a mitad de página.
- **Cobertura:** 9 rutas × 4 anchos (375 / 768 / 1024 / 1440) con sesión iniciada = 36 cargas, **sin desbordamiento horizontal a nivel de página**; más 6 overlays probados a 375 px (detalle de ticket, nuevo ticket, registrar venta, nuevo producto, nuevo personal, detalle de cliente) sin desbordamiento.
- **Defectos encontrados en navegador:** el drawer de detalle hacía scroll entero en móvil (cabecera y pie se iban con el cuerpo) y el input de notas desbordaba 6 px por falta de `min-w-0`.
- **Método:** iframes del mismo origen a ancho exacto, porque la ventana de Chrome no baja de 662 px.
- **Reversión deliberada:** se descartó ensanchar la grilla de Glide porque su raíz está limitada a `max-width:100%` y su propio scroller (`dvn-scroller`) ya resuelve el desplazamiento táctil.

La verificación funcional complementaria está en [qa-2026-09-26.md](odd/tasks/qa-2026-09-26.md), que lista 18 defectos con severidad, incluidos los de interfaz (pestañas faltantes, formato de notas, estado en minúscula en los avisos, botones sin nombre accesible, campo PIN sin teclado numérico). Ese documento es anterior a las correcciones; sus puntos se retoman en §9.

### 7.2 Reglas de adaptación

| Regla | Implementación |
|---|---|
| Nada de scroll horizontal de página | `min-w-0` en la columna de contenido y `overflow-x-auto` en cada tabla |
| Sidebar | Fijo en `lg`+, off-canvas debajo (sin volver al `md:` antiguo) |
| Padding de overlays | `px-4 sm:px-7` |
| Pies de formulario | `flex-wrap` + gap; la acción primaria puede ir a ancho completo en móvil |
| Grillas | Una columna base y variantes `sm:`/`md:` (stat strip 1→3, drawer 1→2 columnas) |
| Cadenas largas | `break-all` (URL del ticket) o `truncate` |
| Tabla ancha | Contenedor con scroll propio; la página no se mueve |

Breakpoints efectivos: `sm` 640, `md` 768, `lg` 1024 (sidebar y hero 7fr/5fr), más anchos fijos en componentes (430 px registro; 500/620/640/820 px overlays).

### 7.3 Accesibilidad

Lo que está en el código: **foco visible** consistente (anillo de 2 px del acento con 2 px de separación, repetido en los botones con `focus-visible:outline-*` para no depender del CSS global); **nombres accesibles** en controles de solo icono — 53 usos de `aria-label` en el frontend, incluidos "Cerrar", "Abrir menú", "Cambiar tema", "Elegir fecha", "Día anterior/siguiente", "Mostrar/Ocultar contraseña", "Ingresar al panel" y acciones con nombre de fila ("Editar Pantalla A53"); **overlays** con `role="dialog"` + `aria-modal="true"` + `aria-label` con el título, `role="alertdialog"` para el descarte y `role="presentation"` en el fondo; **teclado**: Esc cierra overlays y el diálogo de descarte lo intercepta en fase de captura para no cerrar también el modal de abajo, y el menú de transiciones expone `aria-haspopup`/`aria-expanded` con ítems `role="menuitem"`; **anuncios no intrusivos**: toasts con `role="status"`, spinner con `role="status"` y etiqueta, esqueleto con `aria-label`; **contraste**: los pares de peligro (`#dc2626` sobre `#fef2f2` y sus equivalentes oscuros) y el acento con `#0f172a` encima están pensados para leerse, y por eso el texto naranja usa `accent-ink` en lugar del acento base.

Lo que **no** está resuelto: no hay un mínimo de área táctil codificado (los controles van de 34 a 42 px y `Chip` mide 36 px), no hay auditoría de contraste ejecutada con herramienta, y la QA del 2026-09-26 detectó botones sin nombre accesible en el detalle del ticket (los de solo icono, y "Mostrar" la clave era un `div` clickeable). Al reauditar, empezar por ahí.

---

## 8. Decisiones de diseño y trazabilidad

| # | Decisión | Por qué | Fuente |
|---|---|---|---|
| D1 | Adoptar el sistema **Modernist** (Archivo, radio 0, reglas de 2 px, etiquetas a la izquierda) con los colores de la marca, en lugar del acento rojo del prototipo | El prototipo era mono-rojo; la marca es naranja/azul marino. Se conserva la estructura y se sustituye la paleta | [rediseno-panel.md](odd/tasks/rediseno-panel.md), [readme del DS](<design/panel-admin/Rediseño panel administrativo/_ds/modernist-4f88adac-ccf9-4434-bae3-42bfb4042a46/readme.md>) |
| D2 | Tokens scopeados a `.admin-shell` / `.ticket-page`, nunca a `body`/`:root` | El sitio público ya existe y no debe cambiar; panel y ticket son islas visuales | [tokens.css](frontend/src/admin/shared/theme/tokens.css), [tokens.css](frontend/src/ticket/theme/tokens.css) |
| D3 | Modo oscuro por variables CSS en `.admin-shell.dark`, no por la variante `dark:` de Tailwind | `index.html` ya trae `<body class="dark">` para el sitio público, así que la variante está siempre activa y no puede conmutar el tema del panel | [README del admin](frontend/src/admin/README.md), `tokens.css` |
| D4 | El sidebar es siempre navy, en ambos temas | Es el ancla de orientación del panel; invertirlo en claro lo haría competir con el contenido | [Sidebar.jsx](frontend/src/admin/shared/layout/Sidebar.jsx) |
| D5 | Botones con etiqueta a la izquierda (el DS original centra) | Se prefirió la alineación del brief; queda registrado como desvío consciente | [Button.jsx](frontend/src/admin/shared/ui/Button.jsx) |
| D6 | La página pública de ticket es **solo clara** | Decisión del tablero de diseño; además el cliente la abre desde WhatsApp, a menudo de día y con una sola mano | [tokens.css](frontend/src/ticket/theme/tokens.css) |
| D7 | 3 pasos en el seguimiento público para 7 estados del modelo | El diseño tenía 3 columnas; agrupar evita inventar columnas y saca los estados de cierre del tracker | [ticketPresenter.js](frontend/src/ticket/lib/ticketPresenter.js) |
| D8 | Dos identificadores: `codigo` legible (`AT-000148`) y `publicToken` opaco en la URL | El código sirve para hablar por teléfono; el token, para que nadie adivine el enlace de otro cliente. Se descartó el alfanumérico del prototipo (`AT-2X9K4M`) | [ADR 0006](docs/adrs/0006-modelo-de-datos-tickets-e-inventario.md) |
| D9 | Vocabulario distinto por audiencia ("En taller"/"Trabajando", "Listo"/"Listo para recoger") | El técnico piensa en el taller; el cliente piensa en recoger. Un solo término obligaba a que uno de los dos leyera mal | [TicketStatusBadge.jsx](frontend/src/admin/tickets/components/TicketStatusBadge.jsx), [ticketPresenter.js](frontend/src/ticket/lib/ticketPresenter.js) |
| D10 | El nuevo ticket es un formulario de 4 bloques con anclas, no un asistente por pasos | El técnico salta entre bloques y corrige hacia atrás; un asistente bloqueante obliga a retroceder para cambiar el precio | [NewTicketDrawer.jsx](frontend/src/admin/tickets/components/NewTicketDrawer.jsx) |
| D11 | El precio se captura **antes** de las piezas (el brief lo ponía al final) | La pieza se elige contra un precio ya acordado, y así el saldo y la ganancia están visibles al decidir qué repuesto usar | [modulo-tickets.md](odd/tasks/modulo-tickets.md) (fase D3), [brief-tickets.md](design/brief-tickets.md) |
| D12 | El filtro "Mostrar abandonados" del brief se resolvió como **una pestaña más** | Las pestañas ya eran el patrón de filtrado del panel; un interruptor aparte rompía la lectura de la fila de filtros | [TicketsPage.jsx](frontend/src/admin/tickets/TicketsPage.jsx), [brief-tickets.md](design/brief-tickets.md) |
| D13 | El comprobante se llama "Comprobante de servicio" y dice que no es boleta SUNAT | Es un documento de garantía, no tributario; decirlo evita una expectativa legal falsa | [ADR 0007](docs/adrs/0007-estados-del-ticket.md), [TicketDetailDrawer.jsx](frontend/src/admin/tickets/components/TicketDetailDrawer.jsx) |
| D14 | El consentimiento de marketing es **opcional**: el registro continúa y queda "Descartó" | La política de Meta exige consentimiento explícito, no que el alta dependa de él; bloquear el registro por marketing contradecía el objetivo de la tarjeta de sellos | [rediseno-panel.md](odd/tasks/rediseno-panel.md) (R5), [RegisterPage.jsx](frontend/src/community/RegisterPage.jsx) |
| D15 | El panel usa SSE para reflejar cambios entre administradores; la página pública **no** se refresca sola | El panel lo usan dos personas a la vez y necesitan el mismo estado; el cliente no tiene sesión y no se justificó una conexión abierta | [ADR 0028](docs/adrs/0028-tiempo-real-sse-invalidacion.md) |

**Tensiones que quedaron documentadas, no escondidas**

- **3 → 5 → 7 estados.** El PRD partía de `pendiente/trabajando/listo`; el ADR 0007 modeló 5 (agregando `entregado` y `abandonado`); la actualización del mismo ADR llevó a 7 (agregando `aprobado` y `cancelado`). La razón no es estética: **sin `aprobado` no hay un momento claro para descontar stock**, y sin `cancelado` las piezas descontadas no volvían al inventario. El diseño de la página pública siguió con 3 columnas y se resolvió por agrupación (D7).
- **Badge con 8 entradas para 7 estados.** `TICKET_ESTADO_CONFIG` incluye `presupuestado`, que no existe en el modelo ni se usa en ningún otro archivo del frontend: es un resto de una iteración anterior.
- **`AT-2X9K4M` → `AT-000148`.** El prototipo mostraba un código alfanumérico "bonito"; el producto usa un correlativo porque el código se dicta por teléfono y se imprime en el comprobante.

---

## 9. Deuda de diseño abierta

Solo lo que se puede señalar en el código o en un documento vigente, con su consecuencia visible.

1. **`/consultar-ticket` vive en otro sistema visual.** La página de recuperación del enlace (`/ticket` y `/consultar-ticket`, enlazada desde el navbar y el pie del sitio) usa fondo `slate-950`, tarjetas `rounded-2xl`, `backdrop-blur` e inputs `rounded-xl` ([SearchTicketPage.jsx](frontend/src/ticket/SearchTicketPage.jsx)). Es la puerta de entrada de un cliente con un ticket y no se parece a la página de destino. Es el desajuste más grande que queda.
2. ~~**La página pública promete una actualización que no ocurre.** El subtítulo del estado `trabajando` ("Esta página se actualiza sola") y la nota de cabecera ("se actualiza sola cuando tu equipo cambia de estado") prometen un refresco que no existe: `src/ticket/` no tenía polling, `useQuery` ni SSE (el panel sí, por ADR 0028).~~ **Resuelto (2026-10-25):** se implementó el refresco en [TicketPage.jsx](frontend/src/ticket/TicketPage.jsx) — relectura cada `REFRESH_MS` (30 s en producción, 2 s en la suite E2E vía `frontend/.env.e2e`) más un refresco inmediato en `visibilitychange`, y las recargas silenciosas conservan el último estado válido para que un fallo de red no degrade la página a "no encontrado". El copy ya es cierto y el test `el cliente ve el cambio de estado sin recargar la página` lo verifica sin recargar el navegador.
3. **`presupuestado` sin uso.** Existe en el badge y en ningún otro lugar: decidir si se implementa como estado o se elimina.
4. **Los contadores de la franja de métricas no son totales.** "En taller / reparación" y "Listos para entrega" se calculan filtrando `items` de la página cargada, mientras "Total tickets" usa el `total` del servidor; con más de una página dejan de cuadrar.
5. **Contadores por estado y contador en el sidebar, del brief, no existen.** El brief pedía chips con contador y un badge de tickets activos en el ítem "Tickets"; hoy las pestañas no muestran número y el ítem del sidebar no tiene badge (solo Personal y Técnicos tienen "Owner").
6. **Los dos estados de cierre no tienen representación propia en el panel.** La línea de tiempo de 5 columnas se apaga entera para `cancelado`/`abandonado` y solo el badge dice qué pasó; en la página pública sí hay banner. Falta el equivalente del lado del técnico.
7. **La nota para el cliente se captura pero el contrato público no la expone.** El formulario envía `notaCliente`; el contrato documentado en [ticketApi.js](frontend/src/ticket/api/ticketApi.js) no la incluye. También sigue abierta la decisión de R3 sobre una "nota del técnico" visible al cliente.
8. ~~**Dirección del local inconsistente.** El ticket y el comprobante decían "Av. San Luis 1859"; la sección de servicios y su JSON-LD decían "Av. San Luis 1873, Tienda 127" ([CambioBateriaPage.jsx](frontend/src/Components/ServicePage/CambioBateriaPage.jsx)). Un cliente con el comprobante en la mano podía ir a la dirección equivocada.~~ **Resuelto (2026-10-25):** el dueño fijó la dirección correcta y todo el producto —textos, `ADDRESS`, JSON-LD, metas y los dos places del ticket— quedó en **Av. San Luis 1849-1851, Tienda 127, MultiMercado San Borja**.
9. **`OpenSans` declarado y nunca cargado.** `tailwind.config.js` define `fontFamily.OpenSans`, pero [index.html](frontend/index.html) solo carga Nunito, Inter y Archivo: cualquier `font-OpenSans` cae al `sans-serif` del sistema.
10. **Puntos de interfaz que la QA del 2026-09-26 dejó abiertos y que no consta que se hayan cerrado:** notas internas guardadas como texto `"[correo] nota"` sin fecha ni formato; aviso de cambio de estado con el valor técnico en minúscula; mensaje "Ingresa el PIN." que permanece tras completar el PIN; títulos de pestaña genéricos en varias páginas. (El punto de "quién hizo cada cambio" sí está cubierto: la línea de tiempo muestra el usuario por paso.)
11. **Accesibilidad sin normar:** no hay mínimo de área táctil definido, ni auditoría de contraste con herramienta, ni revisión de los controles señalados en la QA.

---

## 10. Cómo se mantiene este documento

El pipeline del repo es `PRD.md` → `DESIGN.md` → ADR → `TECH-DESIGN.md` → `odd/tasks/` → código ([CLAUDE.md](CLAUDE.md)). Este archivo se actualiza **cuando cambia el sistema visual o una decisión de interfaz**, no cuando cambia la implementación interna.

| Si cambia… | Actualizar |
|---|---|
| Un valor de token | `tokens.css` **y** `tokens.js` a mano (el comentario del archivo lo exige) y la tabla §3.2 |
| Un estado del ticket o su etiqueta | §6.1, `ticketPresenter.js` (hero, tono, grupo) y `TicketStatusBadge.jsx` (label, clase) |
| Un componente compartido o una variante | §4 y el bullet correspondiente de [README del admin](frontend/src/admin/README.md) |
| El mapeo 3 pasos ↔ 7 estados | §6.2 y [ticketPresenter.js](frontend/src/ticket/lib/ticketPresenter.js) |
| El layout de una superficie | §5 con la medida nueva |
| Una decisión con trade-off | Una fila nueva en §8, y el ADR si toca datos, seguridad o alcance |
| Se cierra deuda de diseño | Se borra la entrada de §9 (no se marca como resuelta) y, si el aprendizaje importa, queda en el `odd/tasks` de la feature |

**Reglas de edición**

1. **No se escriben valores de memoria.** Todo hex, píxel o etiqueta se copia del archivo fuente enlazado; si no está en el repo, no se afirma.
2. **No se reescribe la historia.** Las tensiones (3→5→7 estados, `AT-2X9K4M`→`AT-000148`, precio antes de piezas) se quedan escritas con su razón; si una decisión se revierte, se agrega la fila nueva.
3. **Cada afirmación de verificación lleva fecha y método.** "Se probó en 9 rutas × 4 anchos" solo se escribe si el `odd/tasks` lo respalda.
4. **No se duplica `TECH-DESIGN.md`.** Si algo es arquitectura, capas o contrato de API, va allá y aquí solo se enlaza.
5. **Cierre de cambio:** `pnpm lint` y `pnpm build` en `frontend/`, y QA visual contra los prototipos de `design/` en claro y oscuro, escritorio y 375 px, antes de dar por buena una modificación del sistema visual.

**Fuentes de verdad visual**

- [design/brief-tickets.md](design/brief-tickets.md) — brief del módulo de tickets.
- [Tickets.dc.html](<design/# Rediseño tickets/Tickets.dc.html>) — tablero de la bandeja, los drawers y el comprobante.
- [Panel Admin Rediseño.dc.html](<design/panel-admin/Rediseño panel administrativo/Panel Admin Rediseño.dc.html>) — tablero del panel y de la página pública de ticket (incluye los tokens en su script).
- [readme del DS Modernist](<design/panel-admin/Rediseño panel administrativo/_ds/modernist-4f88adac-ccf9-4434-bae3-42bfb4042a46/readme.md>) y [readme del DS Organic](<design/panel-admin/Rediseño panel administrativo/uploads/Vista pública de ticket/_ds/organic-63407f5f-1274-4a5a-baa5-b1134c8f83d8/readme.md>) — el sistema adoptado y el alternativo que se descartó (cálido, redondeado, Caprasimo).
- `frontend/src/**` — implementación; gana sobre el prototipo cuando difieren, porque es lo que el usuario ve.
