# ADR 0007: Estados del ticket

## Estado

Aceptado

## Contexto

El PRD define los estados mínimos pendiente/trabajando/listo y deja abierta "la evaluación de
estados adicionales" para la etapa de diseño ("ver Casos borde para estados adicionales a evaluar
en diseño"). El caso borde de "repuesto usado deja inventario en 0" sugiere que el técnico puede
esperar piezas antes de terminar.

## Decisión

Modelar **cinco estados**: `pendiente → trabajando → listo → entregado`, más `abandonado`. El
ticket comienza en `pendiente`, pasa a `trabajando` cuando el técnico empieza, a `listo` cuando
termina la reparación, y a `entregado` cuando el cliente retira el equipo. Cada transición queda
registrada en `historialEstados` para poder revisar/revertir errores del técnico.

**Ciclo de abandono (nueva regla del usuario):** un ticket que no se revisa ni cambia de estado en
**7 días** se marca automáticamente como `abandonado`; permanece activo **15 días** en ese estado.
Pasado ese plazo, se **elimina automáticamente** o se **conserva** — decisión aún abierta, a
confirmar con el usuario antes de implementar. El "cambio de estado" que corta el contador incluye
cualquier transición (trabajando, listo, entregado, reabrir a pendiente) o la adición de notas.

## Alternativas consideradas

- **Solo los 3 del PRD** — válido pero incompleto: sin `entregado` no hay forma de distinguir
  "reparado, esperando que venga el cliente" de "ya se llevó el equipo".
- **Agregar también `esperando repuesto`** — refleja el caso borde de piezas pendientes, pero
  duplica semántica con una nota en el ticket; se prefirió mantener el modelo simple y usar notas.
- **Sin ciclo de abandono** — el técnico resuelve manualmente los tickets viejos; rechazado porque
  el usuario pidió el automatismo de 7/15 días para no dejar ruido eterno en el panel.

## Consecuencias

- El flujo cerrado de 4 estados cubre el ciclo completo de vida visible para el cliente.
- El estado `abandonado` automatiza la limpieza de tickets olvidados y evita que el lookup público
  muestre equipo "en proceso" que ya nadie atiende.
- Trade-off: el estado `entregado` obliga a que el técnico registre el retiro; si se olvida, quedan
  tickets `listo` sin cerrar — mitigado por ser un solo usuario y el historial auditable.
- Trade-off: el ciclo 7/15 días necesita un job programado (cron/intervalo) en el backend NestJS y
  una política para el reabrir tickets abandonados; la regla exacta de "conservar vs. eliminar"
  también queda pendiente de confirmación.

## Actualización (2026-09-25)

Esta actualización reemplaza la lista de estados de la sección Decisión y resuelve el punto
pendiente del ciclo de abandono.

### Estados

`pendiente → aprobado → trabajando → listo → entregado`, más `cancelado` y `abandonado`.

| Estado | Significado | Efecto en stock y caja |
|---|---|---|
| `pendiente` | Equipo recibido, diagnóstico y precio en curso. Las piezas quedan **planificadas** y se muestra su stock disponible. | Ninguno |
| `aprobado` | El cliente aceptó el precio. | Descuenta las piezas planificadas (`ticket_salida`); si falta stock, no se aprueba y se avisa cuál falta. Puede registrarse un adelanto. |
| `trabajando` | El técnico está reparando. | Ninguno |
| `listo` | Reparación terminada. Dispara el aviso por WhatsApp de equipo listo + pedido de reseña (decisión del 2026-09-23). | Ninguno |
| `entregado` | El cliente retiró el equipo. | Crea el **cobro** (ADR 0006) y habilita el comprobante de servicio. |
| `cancelado` | El cliente no aceptó o se desistió. Nuevo estado. | Devuelve al stock las piezas ya descontadas (`ticket_devolucion`). |
| `abandonado` | 7 días sin cambios (automático). | Ninguno |

- `aprobado` es nuevo: en el rubro, la pieza solo se usa cuando el cliente acepta el precio. Sin este
  estado no hay un momento claro para descontar stock.
- `cancelado` es nuevo: sin él, un ticket rechazado quedaba como `abandonado` y las piezas
  descontadas no volvían al stock.
- Revertir un estado queda registrado en `historialEstados`. Volver de `aprobado` (o posterior) a
  `pendiente` devuelve las piezas descontadas, igual que cancelar.
- Agregar una pieza a un ticket ya aprobado la descuenta en ese momento.

### Ciclo de abandono (resuelto)

Un ticket sin cambios en 7 días pasa a `abandonado` y **nunca se borra**: se oculta de la lista
principal, sigue visible con un filtro y puede reabrirse. Borrarlo haría perder el rastro de las
piezas descontadas y de lo cobrado. Se elimina la regla de borrado a los 15 días.

### Comprobante de servicio

Al entregar, el ticket tiene una página pública (`/ticket/<publicToken>`) con diseño de comprobante
y el panel ofrece un botón que abre WhatsApp con el enlace ya escrito (sin costo de API de Meta). El
documento se llama **"Comprobante de servicio"** y aclara que no es boleta SUNAT: no se emite
comprobante electrónico en esta etapa. Contenido: logo, dirección y teléfono del local, código del
ticket, título, cliente, equipo, falla reportada, fechas de ingreso y entrega, técnico, piezas y mano
de obra con precios, adelanto, saldo, método de pago, garantía (días y exclusiones) y un QR al estado
del ticket.