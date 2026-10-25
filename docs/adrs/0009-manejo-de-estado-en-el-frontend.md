# ADR 0009: Manejo de estado en el frontend

## Estado

Aceptado

## Contexto

La SPA existente usa React sin librería global de estado. El módulo nuevo agrega autenticación,
listas y formularios de tickets e inventario, y una vista pública de ticket. El frontend refleja
estado que vive en la base (MongoDB), por lo que la fuente de verdad es el servidor.

## Decisión

Mantener **fuente de verdad en el servidor** y estado de frontend mínimo: contexto/local para la
sesión (admin logueado) y `fetch` con estados de carga/error por vista. Sin librería global de
estado (Redux/Zustand) ni caché de servidor (React Query) en esta versión; los datos se refrescan al
navegar o después de cada mutación.

## Alternativas consideradas

- **Redux / Zustand** — global store potente, pero innecesario: el estado entre vistas es mínimo
  (sesión) y cada vista consulta el servidor.
- **React Query** — excelente para caché y sincronización, pero agrega una dependencia y el patrón
  del proyecto es simple fetch; se puede adoptar cuando el panel crezca.

## Consecuencias

- Cero dependencias nuevas; el frontend sigue simple y fácil de razonar para un equipo de uno.
- Trade-off: sin caché, cada navegación re-fetcha datos; en free tier y con volumen chico es
  aceptable, pero habrá latencias visibles en inventarios grandes.
- Trade-off: la consistencia sin caché significa que dos pestañas abiertas pueden mostrar datos
  desactualizados hasta refrescar; aceptado para un panel de uso individual.