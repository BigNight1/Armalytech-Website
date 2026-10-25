# ADR 0021: Autenticación con JWT en cookie httpOnly

## Estado

Aceptado — reemplaza a ADR 0004.

## Contexto

El ADR 0004 definió una cookie de sesión firmada con HMAC para un único admin. El usuario amplía
el alcance: el panel tendrá varios usuarios (sección Personal, ADR 0023) y, más adelante, roles.
Esto cambia el PRD, que excluía múltiples técnicos (decisión del usuario, 2026-09-23). Hacen falta
dos cosas:

- que la sesión lleve la identidad y el rol, para que los Guards autoricen sin ir a la base en
  cada request;
- poder invalidar las sesiones de un usuario cuando cambia su contraseña o cuando se lo desactiva.
  Con la cookie firmada del ADR 0004 eso no era posible, y quedaba como riesgo aceptado.

El panel se usa desde el navegador, en PC y en celular, y es same-origin gracias a los rewrites de
Vercel (ADR 0002).

## Decisión

Se usa **`@nestjs/jwt`** y el JWT viaja en una **cookie `httpOnly`, `secure` (en producción) y
`SameSite=Lax`**, con el mismo flujo de login y logout que hoy:

- El payload lleva `sub` (id del usuario), `username`, `role` y `tokenVersion`, más `iat` y `exp`.
- Se firma con `JWT_SECRET`, que reemplaza a `SESSION_SECRET`. La expiración viene de
  `JWT_EXPIRES_IN` o de `SESSION_MAX_AGE_SECONDS` (12 h por defecto).
- Cada usuario tiene un `tokenVersion` en la base. El Guard compara el `tokenVersion` del token con
  el guardado. Si difiere, responde `401`. Se incrementa cuando el usuario cambia su contraseña o su
  username, cuando el admin principal lo desactiva o le resetea la contraseña, y con "cerrar
  sesión en todos los dispositivos".
- El frontend no cambia: sigue usando `credentials: 'include'`, sin tocar el token.
- Los endpoints siguen siendo `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/me`.
  `me` ahora devuelve también `role`.

## Alternativas consideradas

- **Access token + refresh token (ambos en cookie httpOnly)** — reduce la ventana si roban un
  access token y permite sesiones largas. No se eligió porque suma un endpoint de refresh, la
  rotación y el almacenamiento de refresh tokens, que es demasiado para 2 a 5 usuarios del panel.
- **JWT en header `Authorization` guardado en `localStorage`** — es el estándar para APIs y apps
  nativas. Se descarta porque un XSS puede robar el token y porque obliga a reescribir el
  `httpClient` y el manejo de sesión. No hay app nativa en los planes.

## Consecuencias

- La sesión incluye el rol, así que los Guards de roles (ADR 0022) lo leen sin consultar la base.
- Resuelve el riesgo del ADR 0004: cambiar la contraseña o desactivar un usuario corta sus
  sesiones activas mediante `tokenVersion`.
- Funciona igual en el navegador del celular y en la PC. No sirve para una app nativa sin
  agregar un modo por header, algo aceptado porque no hay app nativa planificada.
- Trade-off: el chequeo de `tokenVersion` agrega una lectura a Mongo por request autenticado
  (se puede cachear unos segundos). Sin ese chequeo, un JWT puro no se podría revocar.
- Trade-off: el payload del JWT solo va codificado en base64, no cifrado. No se guarda nada
  sensible en él, solo id, username, rol y versión.
- Migración: las sesiones actuales, que son cookies firmadas, dejan de valer al desplegar. Cada
  usuario vuelve a iniciar sesión una vez.
