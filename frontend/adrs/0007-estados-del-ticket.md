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