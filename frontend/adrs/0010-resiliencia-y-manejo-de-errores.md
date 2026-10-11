# ADR 0010: Resiliencia y manejo de errores

## Estado

Aceptado

## Contexto

Las funciones serverless de Vercel son stateless y arrancan por request; MongoDB Atlas es un
servicio externo que puede fallar o tardar. El PRD fuerza dos comportamientos: avisar (no bloquear)
cuando un repuesto usado deja el inventario en 0, y revertir un cambio de estado equivocado. No hay
requisito de alta disponibilidad ni de cargas altas.

## Decisión

- **Conexión a MongoDB cacheada**: reutilizar la conexión dentro del runtime de la función
  (patrón global en NestJS) y reintentar una vez con backoff corto ante fallos transitorios.
- **Validación en servidor**: toda entrada se valida con Pipes de NestJS (`class-validator` /
  DTOs) y los errores se devuelven como `4xx` con JSON uniforme; el frontend muestra el mensaje.
- **Autorización por capa de seguridad**: Guards de NestJS en cada ruta del panel verifican sesión
  antes de ejecutar el handler; si el usuario no tiene autorización, `401` (ADR 0004).
- **Inventario en 0**: al registrar un repuesto usado que deja `cantidad` en 0, la API completa la
  operación y devuelve una advertencia explícita (`warning.stock_zero`) — nunca bloquea en silencio,
  cumpliendo el caso borde del PRD.
- **Estados**: no se imponen transiciones forzadas; el historial permite revertir un cambio
  equivocado de forma auditable (ADR 0007).
- **Sin reintentos automáticos de negocio ni colas** en esta versión: proporcional al riesgo real.
- **Sin backups en esta versión** (ADR 0003): decisión explícita del usuario; proyecto pequeño.
- **Atomicidad del stock PENDIENTE**: transacción Mongoose (verificar soporte en M0) vs. update
  condicional — registrado en ADR 0006, a decidir antes de implementar.

## Alternativas consideradas

- **Colas/workers para escrituras** — robustez empresarial que este negocio no necesita; agrega
  infraestructura y complejidad.
- **Bloquear la operación si el stock queda en 0** — rechazado explícitamente por el PRD: debe
  avisar, no impedir la venta/trabajo.
- **Reintentar sin límite / circuit breaker** — descartado por proporcionalidad en una app de un
  solo operador.

## Consecuencias

- Comportamiento predecible y mensajes claros para un usuario único (el técnico).
- NestJS concentra validación, autorización y errores en un framework, en vez de repetirlos en cada
  función serverless.
- Trade-off: sin reintentos automáticos ni circuit breakers, un fallo puntual de Atlas puede
  mostrarse como error al usuario; aceptable y visible, con posibilidad de reintentar manualmente.
- Trade-off: sin backups, un borrado accidental puede ser irrecuperable hasta que se replique desde
  SQLite; riesgo aceptado por el usuario en esta fase.