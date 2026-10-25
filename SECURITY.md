# Revisión de seguridad — ArmalyTech

**Producto:** sitio público de reparación de celulares + panel administrativo (NestJS + MongoDB) + página pública de seguimiento de ticket por enlace opaco.
**Producción:** https://www.armalytech.com
**Fecha de la revisión:** 2026-10-25
**Commit base:** `ff32c9d` (2026-10-11, último commit; el árbol tiene cambios sin commitear, ver §2.4)
**Alcance:** código propio en `backend/` y `frontend/`, más verificación de comportamiento en producción.
**Fuera de alcance:** infraestructura de Vercel y Atlas (sin acceso de configuración desde el repositorio), proveedor Kapso/Meta, dispositivo del operador.

---

## 1. Resumen ejecutivo

Se revisó el código de autenticación, autorización, cifrado de datos sensibles, validación de entrada, webhooks y exposición de datos, y se ejecutó la suite automatizada de ataques contra una instancia en memoria del backend. **Resultado global: no se encontró ninguna vulnerabilidad explotable de severidad alta o crítica; sí hay riesgos residuales reales, casi todos por omisión de control y no por control roto.**

- **La suite de ataques pasa completa: 33/33** (`backend/test/security.e2e-spec.ts`, ejecutada el 2026-10-25 tras el endurecimiento). Cubre inyección NoSQL y estilo SQL en login, operadores en query-string, manipulación de JWT (`alg:none`, firma ajena, payload editado, expirado, `tokenVersion` obsoleto), mass assignment, fuerza bruta, acceso sin sesión, flags de cookie, huella del framework (`X-Powered-By`) y el comportamiento del throttler con y sin `trust proxy`.
- **La postura de autorización es de lista blanca**: el `SessionGuard` es global y toda ruta exige sesión salvo las seis marcadas `@Public()` explícitamente (`backend/src/auth/auth.module.ts:34`, `backend/src/auth/infrastructure/session.guard.ts:35-41`). Las seis están enumeradas en §3.1.
- **El control más delicado del sistema está bien resuelto**: la clave del equipo se cifra con AES-256-GCM y `TICKET_SECRET_KEY` no tiene fallback ni alias (`backend/src/shared/config/secrets.ts:49-63`, `backend/src/tickets/infrastructure/crypto/ticket-cipher.service.ts:16-24`), y se borra al entregar o cancelar el ticket (`backend/src/tickets/application/ticket.use-cases.ts:461-467`).
- **El riesgo residual más serio era de sesión y de superficie pública, y se corrigió el 2026-10-25**: `PATCH /api/account/password` verificaba la contraseña actual sin *throttle* propio, `POST /api/auth/logout` no revocaba el token, y `POST /api/community/register` —público— devolvía el documento completo del cliente. Los tres están cerrados y verificados (§6.1, R-01/R-02). Lo que queda abierto es de otra naturaleza: CSP, XSS sin probar y riesgos que no se pueden verificar desde el repositorio (R-05, R-09).
- **La suite no prueba XSS ni CORS**, y no existe CSP. Lo que hay es control por construcción (React escapa; no hay `dangerouslySetInnerHTML` ni `innerHTML` en `frontend/src`). Se documenta como control no verificado por prueba, no como control probado (§4.5, R-05).

---

## 2. Alcance y metodología

### 2.1 Activos protegidos

| Activo | Dónde vive | Por qué importa |
|---|---|---|
| Datos de clientes (nombre, teléfono E.164, sellos, consentimiento) | colección `clients` | PII + fidelización; el teléfono identifica a la persona |
| Claves de desbloqueo de equipos (PIN, contraseña, patrón) | campo `claveEquipo.valor` cifrado | da acceso físico/lógico al teléfono del cliente mientras está en el taller |
| Caja (cobros, adelantos, saldos, anulaciones) | `cobros`, `cash-closings` | dinero; una anulación indebida es pérdida directa |
| Sesión del panel (rol `owner` / `admin`) | cookie `armalytech_session` (JWT) | con una sesión `owner` se crea personal, se anulan cobros y se leen claves |
| Credenciales de terceros (Kapso, SMTP, Telegram) | variables de entorno de Vercel/Dokploy | permiten enviar mensajes cobrados o correo en nombre del negocio |

### 2.2 Modelo de amenazas (corto)

- **Atacante externo sin cuenta**: busca endpoints públicos para enumerar clientes/tickets, inyectar en el login, abusar del registro o del formulario de contacto (spam/coste). Es el actor más probable: automatizable y sin costo.
- **Atacante con una sesión `admin`** (técnico descontento, laptop sin bloqueo, cookie robada): busca escalar a `owner`, leer claves de equipos ajenos, anular cobros o borrar el rastro. El diseño lo contiene con `@Roles('owner')` y auditoría, no con aislamiento por ticket.
- **Atacante con acceso al repositorio o al build**: busca secretos en el código o un fallback de cifrado para descifrar claves de equipos. Es la amenaza que motivó el ADR 0025 y el "fix-up" de `TICKET_SECRET_KEY`.
- **No considerado**: DDoS volumétrico, compromiso del proveedor cloud, insider con acceso a la consola de Atlas.

### 2.3 Cómo se probó

1. **Suite automatizada de ataques** (`backend/test/security.e2e-spec.ts`, 537 líneas) contra una app Nest completa levantada con `mongodb-memory-server` (`backend/test/test-app.ts:13-55`). Cada `describe` arranca su propia instancia para que el *throttler* de login y las mutaciones no contaminen otras aserciones (`security.e2e-spec.ts:12-15`). Los payloads solo se disparan contra la app en memoria, nunca contra producción (`security.e2e-spec.ts:7-10`).
2. **Revisión de código dirigida** de `backend/src/{auth,shared,tickets,community,whatsapp,account,staff}`, `frontend/src/admin/shared/api`, `frontend/vercel.ts`, `backend/vercel.json`, `frontend/api/contact.js` y `frontend/nginx/default.conf.template`.
3. **Verificación pasiva en producción** (solo GET/POST sin efectos, 2026-10-25, **antes** del endurecimiento): `GET /api/health` → 200 `{"ok":true,...,"readyState":1}`; `GET /api/inventory/products`, `/api/staff` y `/api/auth/me` sin cookie → 401; `GET /api/tickets/public/<uuid inexistente>` → 404; `OPTIONS /api/contact` → 200 con el origen reflejado (eso es justo lo que R-03 corrigió; hoy responde 204 y sin cabeceras para un origen desconocido). No se ejecutó fuerza bruta ni fuzzing contra producción.
4. **Unitarios que cubren seguridad por caso de uso**: `tickets/infrastructure/crypto/__tests__/ticket-cipher.service.spec.ts` (5 casos) y `tickets/application/__tests__/ticket.use-cases.spec.ts:268-300` (campos expuestos por la vista pública).

### 2.4 Artefactos citados y fecha real

| Artefacto | Fecha | Nota |
|---|---|---|
| `backend/test/security.e2e-spec.ts` | ampliado y ejecutado 2026-10-25 (33 tests) | evidencia principal |
| `backend/test/password-hardening.e2e-spec.ts` | 2026-10-25 (nuevo) | mínimo de contraseña y throttle de cuenta |
| `backend/src/auth/application/logout.use-case.ts` | 2026-10-25 (nuevo) | revocación de sesión |
| `backend/src/shared/config/trust-proxy.ts` | 2026-10-25 (nuevo) | `trust proxy` para el throttler |
| `frontend/api/contact.js` | 2026-10-25 (endurecido) | CORS, rate limit y validación |
| `backend/src/shared/config/secrets.ts` | 2026-09-26 | longitudes mínimas y resolución de secretos |
| `backend/src/shared/config/env.validation.ts` | 2026-10-11 | validación de entorno al arranque |
| `backend/src/whatsapp/infrastructure/kapso-webhook-signature.ts` | 2026-10-11 | HMAC del webhook |
| `docs/adrs/0021-autenticacion-jwt-en-cookie.md` | reemplaza al ADR 0004 | JWT en cookie |
| `docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md` | actualizado 2026-09-26 | cifrado y borrado de la clave |
| `docs/adrs/0029-plantillas-whatsapp-via-kapso.md` | aceptado 2026-10-10 | webhook y firma |
| `docs/adrs/0015-consentimiento-marketing-meta.md` | actualizado 2026-09-25 | consentimiento opcional |

> Nota de rutas: los ADR citados como `frontend/adrs/*` hoy viven en `docs/adrs/*` (movimiento sin commitear: `D frontend/adrs/...`); este informe cita la ruta vigente.

---

## 3. Superficie de ataque

### 3.1 Rutas públicas (sin sesión)

| Método y ruta | Límite | Autenticación | Archivo |
|---|---|---|---|
| `GET /api/health` | global 1000/min | ninguna (solo estado de la conexión) | `backend/src/health/infrastructure/health.controller.ts:22-23` |
| `POST /api/auth/login` | **5/60 s** | credenciales | `backend/src/auth/infrastructure/auth.controller.ts:30-32` |
| `POST /api/auth/logout` | **30/60 s** | ninguna: idempotente, responde `200` siempre y **revoca** si la cookie es válida | `backend/src/auth/infrastructure/auth.controller.ts:82-102` |
| `GET /api/tickets/public/:token` | **60/60 s** | token opaco UUID v4 | `backend/src/tickets/infrastructure/tickets.controller.ts:37-39` |
| `POST /api/tickets/public/lookup` | **15/60 s** | código + teléfono | `backend/src/tickets/infrastructure/tickets.controller.ts:44-46` |
| `POST /api/community/register` | **5/60 s** | ninguna (alta/reconocimiento de cliente) | `backend/src/community/infrastructure/community.controller.ts:48-49` |
| `POST /api/webhooks/kapso` | sin límite (`@SkipThrottle`) | **HMAC-SHA256 del cuerpo crudo** | `backend/src/whatsapp/infrastructure/kapso-webhook.controller.ts:32-33,67-72` |
| `POST /api/contact` (función serverless del frontend, no pasa por Nest) | **5/10 min por IP** (en memoria, por instancia) | ninguna | `frontend/api/contact.js:18-19,147-168` |

`/api/contact` es la única ruta pública que no atraviesa el backend: `frontend/vercel.ts:46-53` la excluye del rewrite a propósito.

### 3.2 Rutas protegidas (exigen cookie válida)

| Grupo | Rutas | Rol exigido | Archivo |
|---|---|---|---|
| Sesión | `GET /auth/me` | autenticado | `backend/src/auth/infrastructure/auth.controller.ts:104-127` |
| Cuenta | `PATCH /account/email`, `PATCH /account/password` | autenticado | `backend/src/account/infrastructure/account.controller.ts:31,61` |
| Tickets | `GET/POST /tickets`, `GET/PATCH /tickets/:id`, `PATCH :id/status`, `PATCH :id/piezas`, `POST :id/notas`, `GET/POST :id/whatsapp`, **`POST :id/reveal-clave`** | autenticado (sin distinción de rol) | `backend/src/tickets/infrastructure/tickets.controller.ts:54-213` |
| Inventario | `/inventory/products`, `/inventory/brands`, `/inventory/categories`, `/inventory/phones` | autenticado | `backend/src/inventory/infrastructure/*.controller.ts` |
| Comunidad | `/community/clients*`, `/community/events`, `/community/visits`, `/community/clients/:id/messages` | autenticado | `backend/src/community/infrastructure/community.controller.ts:73-147` |
| Personal | `/staff` (GET, POST, `PATCH :id/status`, `POST :id/reset-password`) | **`owner`** (a nivel de clase) | `backend/src/staff/infrastructure/staff.controller.ts:25-26` |
| Técnicos | `GET /technicians`; `POST`, `PATCH` | autenticado; **`owner`** en escritura | `backend/src/tickets/infrastructure/technicians.controller.ts:18-32` |
| Cobros, caja y ventas | `GET /cobros`; `POST /cobros/:id/anular`; `/cash-closings`; `/sales` | autenticado; **`owner`** en anulación | `backend/src/tickets/infrastructure/cobros.controller.ts:63,88-90`, `cash-closings.controller.ts:22`, `sales.controller.ts:7` |
| Tiempo real | `GET /api/events` (SSE) | autenticado (no es `@Public`) | `backend/src/shared/realtime/events.controller.ts:18-23` |

### 3.3 Superficie de proxy

- **Vercel**: `frontend/vercel.ts:6-19` enumera los 12 prefijos que se reescriben al backend y todo lo demás cae al shell del SPA (`frontend/vercel.ts:54`); solo se expone lo listado, sin comodín `/api/*`. `backend/vercel.json:8-10` reescribe `/api/:path*` a la función serverless `api/index.ts`.
- **Docker/Dokploy**: `frontend/nginx/default.conf.template` replica la lista de prefijos y reenvía `X-Forwarded-For`/`X-Forwarded-Proto`; el backend confía en **un** salto (`TRUST_PROXY_HOPS`, default 1 en producción) para que el throttler vea la IP real del cliente y no la del contenedor (R-04).
- **Cabeceras**: el frontend emite `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` y HSTS en las dos rutas de despliegue (nginx y `vercel.ts`); el backend ya no anuncia `X-Powered-By` (R-05).

---

## 4. Controles por área

### 4.1 Autenticación: JWT en cookie httpOnly

| Qué controla | Cómo se implementa | Archivo | Cómo se verifica |
|---|---|---|---|
| Transporte del token | cookie `armalytech_session`, `httpOnly: true`, `sameSite: 'lax'`, `secure` solo si `NODE_ENV === 'production'`, `path: '/'` | `backend/src/auth/infrastructure/auth.controller.ts:51-58` | `security.e2e-spec.ts:524-535` (HttpOnly + SameSite=Lax; sin `Secure` en `NODE_ENV=test`) |
| Firma | `@nestjs/jwt` con `resolveJwtSecret`; `JWT_SECRET` canónico, `SESSION_SECRET` alias deprecado con aviso en arranque | `session-token.service.ts:27-32`, `backend/src/shared/config/secrets.ts:20-40`, `env.validation.ts:111-118` | `security.e2e-spec.ts:235-253` (firma ajena) y `255-267` (`alg:none`) |
| Expiración | `SESSION_MAX_AGE_SECONDS` (12 h por defecto) aplicado al `expiresIn` del JWT y al `maxAge` de la cookie | `session-token.service.ts:21-25,43-46` | `security.e2e-spec.ts:278-293` (token expirado) |
| Revocación | `tokenVersion` en Mongo comparado en cada request; se incrementa al cambiar contraseña, correo, al desactivar o resetear | `session.guard.ts:62-66`; `account.use-cases.ts:57,103`; `staff.use-cases.ts:91-94,121-125` | `security.e2e-spec.ts:295-316` (token viejo tras cambio de contraseña) |
| Hash de contraseña | bcrypt, 12 rondas | `backend/src/auth/infrastructure/bcrypt-password-hasher.ts:5` | revisión de código; no hay test de coste |

### 4.2 Autorización: guard global + `@Public` explícito + roles

- **Qué controla**: que ninguna ruta quede abierta por olvido, y que las acciones destructivas queden en `owner`.
- **Cómo se implementa**: dos `APP_GUARD` globales — `SessionGuard` y `RolesGuard` (`backend/src/auth/auth.module.ts:34-35`) — más `ThrottlerGuard` (`backend/src/app.module.ts:50`). `@Public()` es explícito y nombrado (`shared/infrastructure/public.decorator.ts:10`); `@Roles('owner')` se aplica por clase (`staff.controller.ts:26`) o por método (`cobros.controller.ts:90`).
- **Archivo**: `session.guard.ts:35-41` (corta si `@Public`), `roles.guard.ts:16-32` (403 si el rol no está en la lista).
- **Cómo se verifica**: `security.e2e-spec.ts:473-490` prueba 6 rutas protegidas sin cookie (todas 401) y `492-503` confirma que el registro sigue público; `backend/test/tickets.e2e-spec.ts:313-380` confirma 403 para `admin` en rutas de `owner`.
- **Detalle**: `RolesGuard` no consulta la base, lee el rol del request que ya pobló `SessionGuard` (`roles.guard.ts:25-27`). Es correcto porque el rol del token se re-valida contra el usuario en `session.guard.ts:57-66`.

### 4.3 Fuerza bruta

- **Qué controla**: intentos de login por IP.
- **Cómo se implementa**: `@Throttle({ default: { limit: 5, ttl: 60_000 } })` en el controlador; el techo global es 1000/min para no estorbar el uso normal del panel (`backend/src/app.module.ts:27-29`).
- **Cómo se verifica**: `security.e2e-spec.ts:446-458` envía 6 intentos fallidos y exige `no 429` en los primeros 5 y `429` en el sexto. En producción se observa `X-Ratelimit-Limit: 15` en `/api/tickets/public/lookup`, coherente con `tickets.controller.ts:45`.
- **Límite honesto**: el *tracker* es `req.ip`, y el backend no configura `trust proxy` (ver R-04). Los demás endpoints solo tienen el techo global de 1000/min (ver R-01).

### 4.4 Inyección NoSQL

- **Qué controla**: que un operador (`$ne`, `$gt`, `$regex`, `$where`) llegue como valor al driver.
- **Cómo se implementa**: `ValidationPipe({ whitelist: true, transform: true })` global (`backend/src/create-nest-app.ts:23`). Los DTO son clases con `@IsString()`/`@IsInt()`, así que un objeto en `email`, `q`, `categoryId` o `consent` falla antes de tocar Mongo. Las búsquedas por texto escapan el regex antes de construir `RegExp` (`ticket.repository.ts:206`, `client.repository.ts:136`).
- **Cómo se verifica**: `security.e2e-spec.ts:71-83` (3 payloads de operadores en login), `103-114` (3 payloads estilo SQL), `142-164` (operadores anidados en query-string → 400) y `166-190` (payloads con forma de ReDoS y comodín responden 200 en < 2 s).
- **Observación**: el login no usa `$where` ni `eval`; `findByEmail` concatena el correo en un `$or` con valores string (`backend/src/auth/infrastructure/user.repository.ts:32-41`), no objetos, por lo que la concatenación no habilita inyección.

### 4.5 XSS y serialización

- **Qué controla**: que el contenido del cliente (nombre, `titulo`, `notaCliente`, notas) no se interprete como HTML.
- **Cómo se implementa**: la API solo devuelve JSON, y el frontend renderiza texto con React. **No hay** `dangerouslySetInnerHTML`, `innerHTML` ni `eval(` en `frontend/src` (búsqueda sobre todo el árbol, 0 coincidencias). El formulario de contacto escapa con `escapeHtml` antes de armar el correo y el mensaje de Telegram (`frontend/api/contact.js:3-7,20-25,79-88`).
- **Cómo se verifica**: **no hay prueba automatizada de XSS en la suite**. Es control por construcción, verificado por revisión de código, no por ataque; se declara así a propósito (§6, R-05). No hay sinks HTML identificados donde volcar contenido del cliente.

### 4.6 Cifrado de datos sensibles: clave del equipo

- **Qué controla**: que la clave del equipo no se pueda leer desde la base ni desde un volcado.
- **Cómo se implementa**: AES-256-GCM con IV aleatorio de 96 bits por operación y `authTag`; formato almacenado `iv:authTag:ciphertext`; clave derivada con SHA-256 de `TICKET_SECRET_KEY` (`ticket-cipher.service.ts:23-35`). **Sin fallback**: el servicio lanza en el constructor si falta o mide menos de 32 caracteres (`:16-21`), y `env.validation.ts:123-125` aborta el arranque por la misma razón. `TICKET_SECRET_KEY` no tiene alias deprecado, a diferencia de `JWT_SECRET` (`secrets.ts:42-48`).
- **Cómo se verifica**: `ticket-cipher.service.spec.ts:31-44` (falla sin clave, falla con clave corta, no cae a una clave derivada de `JWT_SECRET`); `ticket.use-cases.spec.ts:194-201` (el valor guardado no es el PIN) y `248-266` (se borra al cancelar). Limitación conocida, no explotable sin acceso a la base + al secreto: `decrypt` devuelve `undefined` en cualquier error en lugar de propagarlo (`ticket-cipher.service.ts:54-56`), enmascarando un fallo de integridad como "clave vacía"; es robustez, no un agujero.
- **Desbloqueo auditado**: `POST /api/tickets/:id/reveal-clave` descifra y **registra** `{usuarioId, usuarioEmail, fecha}` en `auditoriaClave` antes de responder (`ticket.use-cases.ts:845-869`).

### 4.7 Exposición de datos en la vista pública del ticket

- **Qué controla**: que el enlace opaco no filtre datos internos.
- **Cómo se implementa**: `getPublicByToken` construye la respuesta a mano y **solo** incluye `codigo`, `estado`, `titulo`, `notaCliente`, `cliente.{nombre,apellido}`, `equipo.{marca,modelo,color}`, `precioTotal`, `adelanto`, `saldo`, fechas e `historialEstados.{estado,fecha}` (`backend/src/tickets/application/ticket.use-cases.ts:282-313`).
- **Qué NO sale**: `claveEquipo` (ni cifrada), `notasInternas`, `cliente.telefono`, `cliente.clienteId`, `equipo.imei`, `equipo.fallaReportada`, `piezas.costoUnitario`, `tecnicoId`, `auditoriaClave`, `publicToken`.
- **Cómo se verifica**: `ticket.use-cases.spec.ts:268-300` crea un ticket con PIN, notas internas y teléfono, y exige que `claveEquipo`, `notasInternas` y `telefono` sean `undefined` en la vista pública. La lista interna del panel también recorta el cifrado (`tickets.controller.ts:74-82`).
- **Refuerzo**: la página `/ticket/:token` declara `noindex` (`frontend/src/ticket/TicketPage.jsx:81`) y no está en el sitemap ni se prerenderiza (`frontend/scripts/prerender.mjs:22-24`).

### 4.8 Enumeración de tickets

- **Qué controla**: que no se puedan listar tickets ajenos.
- **Cómo se implementa**: el enlace usa `publicToken = crypto.randomUUID()` (UUID v4, 122 bits) y se busca por igualdad exacta, no por `codigo` (`ticket.use-cases.ts:117`, `ticket.repository.ts:76-79`). El buscador alternativo exige **código + teléfono** y compara solo dígitos con longitud mínima 7 (`ticket.use-cases.ts:340-350`); código inexistente y teléfono que no coincide devuelven el **mismo** 404 con el mismo mensaje (`:334-350`), así que la respuesta no distingue "no existe" de "teléfono incorrecto".
- **Cómo se verifica**: `GET /api/tickets/public/<uuid> inexistente` → 404 en producción (2026-10-25); los límites de 15/min en `lookup` y 60/min en la vista por token acotan la búsqueda por fuerza bruta.

### 4.9 Webhooks (Kapso)

- **Qué controla**: que solo Kapso pueda escribir en el sistema, sin sesión de admin.
- **Cómo se implementa**: HMAC-SHA256 en hex sobre los **bytes crudos** del cuerpo, comparado en tiempo constante y validando longitud antes (`kapso-webhook-signature.ts:8-25`); `rawBody: true` en el bootstrap compartido para que firma y cuerpo no se desincronicen (`create-nest-app.ts:17`); sin `KAPSO_WEBHOOK_SECRET` responde 503 en lugar de aceptar (`kapso-webhook.controller.ts:55-61`); idempotencia por `X-Idempotency-Key` (`:74-77`).
- **Cómo se verifica**: `backend/test/kapso-webhook.e2e-spec.ts:91-116` cubre firma ausente, inválida, secreto incorrecto y firma de otro cuerpo (todos 401); `:283-309` cubre el replay de la misma clave.
- **Trade-off declarado**: `@SkipThrottle()` a propósito, porque Kapso reintenta en ráfaga (`kapso-webhook.controller.ts:26-33`); la mitigación es la firma, no el límite.

### 4.10 Secretos y configuración

- **Qué controla**: que la app no arranque con un secreto débil, ausente o con valor por defecto.
- **Cómo se implementa**: `validate()` corre en `ConfigModule.forRoot` y lanza antes de escuchar (`env.validation.ts:97-127`); exige `MONGODB_URI` (`:22-24`), resuelve el secreto JWT con mínimo de 32 caracteres (`secrets.ts:33-37`) y `TICKET_SECRET_KEY` sin fallback (`secrets.ts:52-62`). En `NODE_ENV=test` se ignora `backend/.env` para que los tests nunca lean credenciales reales (`backend/src/app.module.ts:23-25`).
- **Cómo se verifica**: no hay test unitario de `validate()`; se verificó por lectura y por el arranque de la app de tests, que sin `TICKET_SECRET_KEY` falla. `backend/.env` está gitignoreado (`backend/.gitignore:6`, comprobado con `git check-ignore`). **Deuda encontrada**: `backend/.env.example` quedó desactualizado — solo documenta `SESSION_SECRET` (el alias deprecado) y **no** menciona `JWT_SECRET`, `TICKET_SECRET_KEY` ni las variables `KAPSO_*` (`backend/.env.example:1-18`); quien copie ese archivo no arranca. Ver R-08.

### 4.11 CORS y cookies

- **CORS del backend**: **no hay CORS habilitado** (sin `enableCors` en `create-nest-app.ts` ni en `app.module.ts`). El navegador solo puede llamar a `/api` desde el mismo origen, que es como funciona el panel (rewrites de Vercel). Es la postura correcta para este diseño.
- **CSRF**: no hay token CSRF; la defensa es `SameSite=Lax` + JSON + mismo origen. Un POST cross-site no lleva la cookie y el backend no acepta formularios HTML. Un GET cross-site sí lleva cookie, pero ninguna ruta de escritura es GET.
- **Producción**: `POST /api/contact` **sí** refleja el origen con credenciales (`frontend/api/contact.js:45-48`); verificado hoy con `OPTIONS` y `Origin: https://example.org`, que devolvió `Access-Control-Allow-Origin: https://example.org` y `Access-Control-Allow-Credentials: true`. Ver R-03.

### 4.12 Errores y logging

- **Qué controla**: que un fallo interno no devuelva stack, query ni rutas del servidor.
- **Cómo se implementa**: `HttpExceptionFilter` global (`create-nest-app.ts:24`) arma siempre `{ ok:false, error:{ statusCode, message, code, path, timestamp } }`; solo `HttpException` y errores de dominio exponen su mensaje, y cualquier otra excepción se registra en el log y se responde como `500 / "Internal server error"` (`http-exception.filter.ts:142-147`).
- **Cómo se verifica en producción (2026-10-25)**: `POST /api/tickets/public/lookup` con un objeto en `codigo` devolvió `500` y el cuerpo exacto `{"ok":false,"error":{"statusCode":500,"message":"Internal server error","code":"internal_error","path":"/api/tickets/public/lookup","timestamp":"2026-10-25T11:20:00.788Z"}}`. Sin stack, sin mensaje de Mongoose. El control funciona; el 500 en sí es un hallazgo (R-06).
- **Lo que sí filtra**: el encabezado `X-Powered-By: Express` (observado hoy) y la ausencia de cabeceras de seguridad (R-05).

---

## 5. Resultados de la suite de ataques

Ejecución del **2026-10-25**, `pnpm test:e2e -- security`, sobre el árbol endurecido: **1 suite, 33 tests, 33 pasan, 0 fallan**. La tabla lista los casos principales, no los 33 uno por uno.

| Caso de prueba (real) | Vector | Esperado | Obtenido | Estado |
|---|---|---|---|---|
| `rejects operator payload 0..2` (`security.e2e-spec.ts:71-83`) | `{"$ne":null}`, `{"$gt":""}`, `{"$ne":"x"}` en `email`/`password` | 400/401 sin `Set-Cookie` | 400 / 401, sin cookie | ✅ |
| `rejects SQL-style payload 0..2` (`:103-114`) | `' OR 1=1 --`, `admin' --`, `' OR '1'='1` | 400/401 sin cookie | 400 / 401 | ✅ |
| `rejects a Mongo operator nested under categoryId / q / consent` (`:142-164`) | `?categoryId[$ne]=x`, `?q[$regex]=.*`, `?consent[$ne]=approved` | 400 en los tres | 400 en los tres | ✅ |
| `treats a ReDoS-shaped q as a literal, escaped search term and answers fast` (`:166-177`) | `(a+)+$` | 200 en < 2 s | 200 en ~15 ms | ✅ |
| `treats a wildcard-shaped q as a literal, escaped search term and answers fast` (`:179-190`) | `.*` | 200 en < 2 s | 200 en ~8 ms | ✅ |
| `accepts the genuinely valid token as a control` (`:230-233`) | token real | 200 | 200 | ✅ |
| `rejects a token signed with a different secret` (`:235-253`) | JWT firmado con otro secreto | 401 | 401 | ✅ |
| `rejects an alg:none token` (`:255-267`) | header `alg:none`, firma vacía | 401 | 401 | ✅ |
| `rejects a token whose payload was edited (role escalation) without re-signing` (`:269-276`) | `role` mutado conservando la firma vieja | 401 | 401 | ✅ |
| `rejects an expired token` (`:278-293`) | `expiresIn: -3600` | 401 | 401 | ✅ |
| `rejects a valid-signature token whose tokenVersion is now stale after a password change` (`:295-316`) | token válido previo a un cambio de contraseña | 401 | 401 | ✅ |
| `strips unknown/privileged fields from the login body` (`:344-357`) | `role`, `isAdmin`, `tokenVersion` en el body | 200 y rol `owner` real | 200, rol `owner` | ✅ |
| `ignores a privileged role/tokenVersion/isAdmin injected into the staff-creation body` (`:359-375`) | `role:'owner'` al crear personal | 201 y rol `admin` | 201, rol `admin` | ✅ |
| `ignores a privileged tokenVersion/isAdmin injected into the account-update body` (`:377-399`) | campos privilegiados en `PATCH /account/email` | 200; sin `isAdmin`/`tokenVersion` en la respuesta | 200, campos ausentes | ✅ |
| `ignores privileged fields injected into a product-creation body` (`:401-426`) | `role`/`isAdmin`/`tokenVersion` en producto | 201 sin esos campos | 201, ausentes | ✅ |
| `throttles repeated failed logins (limit: 5/60s per existing config)` (`:446-458`) | 6 intentos fallidos | 429 en el 6.º | 401×5 y 429 en el 6.º | ✅ |
| `rejects GET /api/inventory/products ... [6 rutas]` (`:473-490`) | request sin cookie | 401 y `ok:false` | 401 en las 6 | ✅ |
| `keeps /community/register public` (`:492-503`) | alta sin sesión | ≠ 401 | 201 | ✅ |
| `sets HttpOnly and SameSite on the session cookie (Secure only in production)` (`:524-535`) | flags de la cookie de login | `HttpOnly`, `SameSite=Lax`, sin `Secure` en test | exacto | ✅ |
| *(nuevo)* sin huella del framework | `GET /api/health` | sin `X-Powered-By` | cabecera ausente | ✅ |
| *(nuevo)* `TRUST_PROXY_HOPS=0` ignora `X-Forwarded-For` | 6 logins con XFF distintos | comparten cubo → 429 en el 6.º | 429 en el 6.º | ✅ |
| *(nuevo)* `TRUST_PROXY_HOPS=1` respeta `X-Forwarded-For` | los mismos 6 logins | cubos distintos → sin 429 | ningún 429 | ✅ |

**Lo que esta tabla no cubre** (y por eso no se afirma que esté cubierto): XSS, CORS, CSRF, clickjacking, ni ninguna ruta que no sea `GET` en el bloque de "sin sesión". Ver §6.

---

## 6. Hallazgos abiertos y riesgos residuales

Cada hallazgo indica impacto, probabilidad y recomendación. **El 2026-10-25 se cerraron seis de los
nueve (R-01, R-02, R-03, R-04, R-06, R-08), uno quedó parcial (R-05) y dos siguen abiertos (R-07 y
R-09)**, con test cuando el riesgo era automatizable. Lo que sigue abierto está marcado como tal, no
disimulado.

### 6.1 Estado de cada riesgo

| ID | Riesgo | Estado | Qué lo cierra / qué falta | Verificación |
|---|---|---|---|---|
| R-01 | Sin throttle al verificar contraseña; logout no revocaba el token | 🟢 **Corregido** | `LogoutUseCase` sube `tokenVersion`; `@Throttle(10/60s)` en `PATCH /account/{password,email}` | `logout.use-case.spec.ts` (3) · `password-hardening.e2e-spec.ts` · `e2e/tests/session-revocation.spec.ts` |
| R-02 | El registro público devolvía el documento del cliente y sobrescribía su nombre | 🟢 **Corregido** | Proyección `{ firstName, stamps }` + `isNewClient`; el re-registro no reescribe nombres; `@Throttle(5/60s)` | `community.e2e-spec.ts` (2 instancias) · `e2e/tests/security-contract.spec.ts` |
| R-03 | `/api/contact` con CORS reflejado y sin límite | 🟢 **Corregido** | Allowlist de orígenes, sin `Allow-Credentials`, 5 envíos/10 min por IP, topes de longitud | Revisión de código + `pnpm lint`/`build` (serverless no ejecutable en local) |
| R-04 | El throttle usa `req.ip` sin `trust proxy` | 🟢 **Corregido** | `app.set('trust proxy', …)` con `TRUST_PROXY_HOPS` (1 en producción, 0 en el resto) | `security.e2e-spec.ts`: con 0 los XFF falsos comparten cubo; con 1 no |
| R-05 | Sin cabeceras de seguridad ni CSP; XSS sin probar | 🟡 **Parcial** | Cabeceras sí (4 + HSTS) y `x-powered-by` deshabilitado; **CSP y casos XSS siguen pendientes** | E2E: `x-powered-by` ausente en `/api/health` |
| R-06 | Lookup público sin DTO → 500; endpoint de notas sin validación | 🟢 **Corregido** | `LookupPublicTicketDto` y `AddTicketNoteDto` (`@MaxLength`), errores 400 en español | `tickets.e2e-spec.ts` (+4) · `e2e/tests/security-contract.spec.ts` |
| R-07 | `mustChangePassword` solo se aplica en el cliente | 🔴 **Abierto** | Falta rechazo 403 en el `SessionGuard` | — |
| R-08 | Temporales de 6 caracteres y `.env.example` incompleto | 🟢 **Corregido** | Mínimo 8 en alta y reset; `.env.example` con `JWT_SECRET`, `TICKET_SECRET_KEY`, `TRUST_PROXY_HOPS` y el alias marcado | `password-hardening.e2e-spec.ts` |
| R-09 | Backups, rotación de secretos, dependencias | ⚪ **No verificable** | Nada de eso vive en el repositorio | — |

**Lo que la corrección no cambia**: los controles que ya estaban bien siguen igual (lista blanca de
rutas, cifrado AES-256-GCM sin fallback, `tokenVersion`, flags de cookie). Este pase agregó controles;
no relajó ninguno.

### R-01 — Sin *throttle* en los endpoints que verifican contraseña, y el logout no revoca la sesión (severidad media)

- **Qué pasa**: `PATCH /api/account/password` y `PATCH /api/account/email` comparan `currentPassword` (`backend/src/account/application/account.use-cases.ts:34-40,81-87`) y no tienen `@Throttle`; solo aplica el techo global de 1000/min (`backend/src/app.module.ts:29`). Además `POST /api/auth/logout` únicamente borra la cookie (`auth.controller.ts:72-77`): **no** incrementa `tokenVersion`, así que un token copiado sigue sirviendo hasta el `exp` (12 h por defecto). No existe endpoint de "cerrar sesión en todos los dispositivos", aunque el ADR 0021 lo menciona como disparador de `tokenVersion` (`docs/adrs/0021-autenticacion-jwt-en-cookie.md:30-33`).
- **Impacto**: con una cookie robada (equipo sin bloqueo, extensión maliciosa), el atacante puede probar contraseñas actuales a 1000/min para apropiarse de la cuenta, y el usuario no tiene forma de cortar esa sesión salvo cambiando su contraseña. El vector realista es un equipo compartido del taller, no un robo remoto (`httpOnly` bloquea el robo por JS).
- **Probabilidad**: baja (requiere una sesión válida), pero el coste de mitigarlo es mínimo.
- **Recomendación**: `@Throttle({ default: { limit: 5, ttl: 60_000 } })` en ambos `PATCH`; subir `tokenVersion` en `logout` o añadir `POST /api/auth/logout-all`; y aplicar `mustChangePassword` en el servidor (R-07).
- **✅ Corregido (2026-10-25)**: `POST /api/auth/logout` es ahora `@Public()` y **siempre** responde `200 { ok: true }` limpiando la cookie, pero si la cookie decodifica y es válida ejecuta `LogoutUseCase`, que sube `tokenVersion` del usuario ([auth.controller.ts](backend/src/auth/infrastructure/auth.controller.ts), [logout.use-case.ts](backend/src/auth/application/logout.use-case.ts)). El guard ya comparaba `tokenVersion`, así que el token —incluso una copia robada— muere en la petición siguiente. Throttle `30/60 s` en el logout y `10/60 s` en los dos `PATCH` de cuenta. **Trade-off explícito**: cerrar sesión revoca *todas* las sesiones de ese usuario, no solo la del navegador que la cierra; para un panel donde cada persona tiene una cuenta es el comportamiento que se espera de "cerrar sesión", y queda escrito aquí para que nadie lo descubra por sorpresa.

### R-02 — El registro público devuelve el documento completo del cliente y sobrescribe su nombre (severidad media)

- **Qué pasa**: `POST /api/community/register` es `@Public()` y responde `{ client, isNewClient, visitCount }` con el objeto `Client` entero (`community.controller.ts:47-71`), que incluye `phoneE164`, `visitCount`, `stamps`, `loyaltyCycle`, `rewardsClaimed`, `consentAt`, `firstVisitAt` y `lastVisitAt` (`client.repository.ts:161-178`). Si el teléfono ya existe, `upsertVisit` **sobrescribe** `firstName`/`lastName` con lo que envíe el llamante (`client.repository.ts:38-50`).
- **Impacto**: cualquiera que conozca (o adivine) un celular peruano de 9 dígitos confirma que es cliente del taller, lee su historial de fidelización y su consentimiento, y **cambia el nombre** del registro. Con 10 req/min por IP se pueden probar ~14 400 números al día. No expone tickets ni claves.
- **Probabilidad**: media-alta (no requiere autenticación y el flujo es legítimo para cualquiera).
- **Recomendación**: devolver una proyección mínima (`{ isNewClient, visitCount, stamps }`, sin `phoneE164` ni fechas) y no reescribir el nombre en un alta repetida; si el negocio necesita corregir el nombre, hacerlo por el panel con sesión.
- **Cobertura actual**: `security.e2e-spec.ts:492-503` solo verifica que el endpoint siga público, no qué devuelve.
- **✅ Corregido (2026-10-25)**: la respuesta es una proyección mínima —`{ client: { firstName, stamps }, isNewClient }`— y el re-registro **no** reescribe `firstName`/`lastName` ([community.controller.ts](backend/src/community/infrastructure/community.controller.ts), [client.repository.ts](backend/src/community/infrastructure/client.repository.ts)). Throttle bajado a `5/60 s`. Cubierto en dos capas: `community.e2e-spec.ts` (proyección exacta con `toEqual`, no-sobrescritura, 429 del registro) y `e2e/tests/security-contract.spec.ts`, que además comprueba que la respuesta serializada no contiene `phoneE164`, `consentAt`, `firstVisitAt`, `lastVisitAt`, `visitCount` ni el número.
- **⚠️ Riesgo residual aceptado**: la respuesta sigue diciendo `isNewClient`, así que un atacante puede confirmar si un teléfono está registrado y, si lo está, obtener el nombre de pila y los sellos. Es el precio de que la pantalla del QR pueda saludar por su nombre ("¡Hola de nuevo, Ana!"), y es una decisión de producto, no un descuido. Si algún día pesa más la privacidad que la experiencia, la salida es una respuesta idéntica para ambos casos y un mensaje neutro en pantalla.

### R-03 — `POST /api/contact`: CORS reflejado con credenciales y sin límite de tasa (severidad media)

- **Qué pasa**: la función serverless del frontend refleja el `Origin` recibido y habilita credenciales (`frontend/api/contact.js:45-48`), y no tiene ningún límite de peticiones. Verificado en producción hoy: `OPTIONS` con `Origin: https://example.org` devuelve `Access-Control-Allow-Origin: https://example.org` y `Access-Control-Allow-Credentials: true`.
- **Impacto**: cualquier sitio de terceros puede usar el formulario como relay: envía correo por el SMTP del negocio y mensajes por el bot de Telegram (`frontend/api/contact.js:9-40,68-99`). El vector no es robar datos (el endpoint no lee cookies) sino **spam y reputación**: agotar la cuota SMTP, ensuciar la reputación del dominio y llenar el Telegram del dueño. El HTML sí está escapado (`:3-7`), así que no hay inyección.
- **Probabilidad**: alta; es automatizable y no cuesta nada.
- **Recomendación**: fijar el origen permitido (`https://www.armalytech.com`) en lugar de reflejarlo; quitar `Access-Control-Allow-Credentials` (no hace falta); añadir límite por IP (p. ej. 3/10 min) y un honeypot o captcha; considerar mover el envío al backend, donde ya hay *throttler*.
- **✅ Corregido (2026-10-25)** en [frontend/api/contact.js](frontend/api/contact.js), verificado leyendo el código y con `pnpm lint`/`pnpm build` en verde (no hay binario de Vercel en el host, así que el comportamiento del serverless no se probó contra un despliegue):
  - CORS con allowlist explícita (`www.armalytech.com`, `armalytech.com`, `localhost:5173`, `127.0.0.1:5173`) y `Vary: Origin`. Un origen desconocido **no** recibe cabeceras CORS.
  - `Access-Control-Allow-Credentials` eliminado: ya no se emite nunca.
  - Límite por IP de **5 envíos / 10 min** (`429` con mensaje en español), con barrido de entradas expiradas para no crecer sin techo.
  - Topes de longitud (80/30/120/2000) y validación de formato de email → `400` con mensaje por campo.
  - Los logs de error registran solo el mensaje, nunca el objeto del transporte ni variables de entorno.
- **Límite residual que queda escrito a propósito**: el `Map` del throttle vive en la instancia caliente de la función, así que no es una cuota global — un atacante puede rotar instancias. Y `getClientIp` toma la primera entrada de `X-Forwarded-For`, que en Vercel la fija la plataforma pero que un cliente directo podría intentar falsificar. Para cerrarlo del todo hace falta un store compartido (Upstash/Redis) o mover el envío al backend, que ya tiene `ThrottlerGuard`; queda como recomendación, no como hecho.

### R-04 — El *throttle* usa `req.ip` pero no se configura `trust proxy` (severidad baja-media, **no verificada en producción**)

- **Qué pasa**: `ThrottlerGuard` toma `req.ip` (confirmado en `node_modules/@nestjs/throttler/dist/throttler.guard.js:144-145`). El backend nunca llama a `app.set('trust proxy', ...)` (0 coincidencias en `backend/src`), mientras los proxies reenvían `X-Forwarded-For` (`frontend/nginx/default.conf.template:22,41`; en Vercel lo inyecta la plataforma).
- **Impacto**: según cómo resuelva Express la IP detrás de cada proxy, el límite de 5/min puede (a) colapsar en un único cubo compartido —un atacante bloquea el login de todos durante 60 s— o (b) contar IPs internas distintas por request y quedar inefectivo.
- **Probabilidad**: media. **No lo verifiqué contra producción** porque hacerlo exige enviar tráfico de fuerza bruta; lo observado es que el límite responde (`X-Ratelimit-Limit: 15` y `Remaining` bajando en `lookup`), consistente con un tracker que distingue al menos mi origen.
- **Recomendación**: fijar `trust proxy` al número real de saltos en Dokploy/nginx y un `getTracker` propio que use la primera IP de `X-Forwarded-For` con fallback a `req.ip`; añadir un test e2e que verifique que dos IPs distintas no comparten cubo.
- **✅ Corregido (2026-10-25)**: `app.set('trust proxy', resolveTrustProxyHops())` en el bootstrap ([create-nest-app.ts](backend/src/create-nest-app.ts), [trust-proxy.ts](backend/src/shared/config/trust-proxy.ts)). Valor por `TRUST_PROXY_HOPS`, con **1 en producción y 0 en cualquier otro entorno**: producción es el único sitio con un proxy real delante, y en tests/desarrollo confiar en la cabecera permitiría a cualquiera elegir su propio cubo del throttler — justo lo contrario de lo que este riesgo señala.
  El test es **discriminante en dos direcciones**: con `0`, seis logins con `X-Forwarded-For` distintos siguen compartiendo cubo (el 6.º es 429); con `1`, esos mismos valores dan cubos distintos. Sin el `app.set`, el segundo bloque fallaría.

### R-05 — Sin CSP ni cabeceras de seguridad; XSS no está probado (severidad media por impacto, baja por probabilidad)

- **Qué pasa**: no hay `helmet` ni cabeceras de seguridad en el backend (0 coincidencias de `helmet`, `Content-Security-Policy`, `X-Frame-Options` en el repositorio) y `frontend/nginx/default.conf.template` tampoco las agrega. En producción, la home devuelve `Strict-Transport-Security` (lo pone Vercel) pero **no** CSP, `X-Frame-Options`, `X-Content-Type-Options` ni `Referrer-Policy`, y la API expone `X-Powered-By: Express`. La suite no incluye ningún caso de XSS (§5).
- **Impacto**: si en el futuro se introduce un `dangerouslySetInnerHTML` o una dependencia con sink HTML, no hay segunda línea de defensa. Mientras tanto, el riesgo es de endurecimiento, no de explotación conocida.
- **Probabilidad**: baja hoy (React escapa; 0 sinks HTML en `frontend/src`); crece con cada feature nueva de contenido enriquecido.
- **Recomendación**: añadir una CSP en `vercel.ts`/nginx (empezando en `report-only` por el SPA), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `frame-ancestors 'none'`; deshabilitar `x-powered-by`; y añadir dos o tres casos de XSS reflejado/almacenado a la suite.
- **🟡 Parcialmente corregido (2026-10-25)**:
  - ✅ Cabeceras en los dos caminos de despliegue, para todas las respuestas: `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`,
    `Permissions-Policy: camera=(), microphone=(), geolocation=()` y `Strict-Transport-Security: max-age=31536000`
    (sin `includeSubDomains` ni `preload`: los subdominios no se gestionan desde este repo y `preload` es
    prácticamente irreversible). En [nginx](frontend/nginx/default.conf.template) se repiten dentro de cada
    `location` que declara su propio `add_header`, porque nginx no hereda cabeceras en ese caso — si no, justo
    las respuestas HTML se quedaban sin ellas. En [vercel.ts](frontend/vercel.ts) van por
    `routes.header('/(.*)', …)`, que `@vercel/config` v1 sí tipa.
  - ⏳ **CSP sigue pendiente a propósito**: el sitio usa JSON-LD inline, un iframe de Google Maps y el widget de
    WhatsApp; una política estricta necesita nonces y una pasada de QA visual. Es la deuda consciente de este
    apartado, no un olvido.
  - ⏳ `X-Powered-By: Express` — ver el estado en la tabla de §6.1.
  - ⏳ Los casos de XSS en la suite siguen sin existir (§5 lo dice explícitamente).

### R-06 — `POST /api/tickets/public/lookup` no tiene DTO y devuelve 500 ante entrada no-string (severidad baja)

- **Qué pasa**: el handler tipa el body con un literal `{ codigo?: string; telefono?: string }` (`tickets.controller.ts:46-52`). Sin clase DTO, `ValidationPipe` no valida ni filtra, y el caso de uso aplica `.trim()`/`.replace()` sobre lo recibido (`ticket.use-cases.ts:319-320`). Producción, hoy: `{"codigo":{"$ne":null},"telefono":"000000000"}` → **500** con cuerpo genérico; `{}` → 400 correcto.
- **Impacto**: no hay inyección (el 500 ocurre antes de Mongo) ni fuga de datos (el filtro responde "Internal server error", §4.12). El coste es ruido en los logs, un 500 que un monitor confundirá con una caída y una superficie de error no contractual para un endpoint público.
- **Probabilidad**: alta (cualquiera puede dispararlo); impacto real bajo.
- **Recomendación**: crear `LookupPublicTicketDto` con `@IsString() @MaxLength(20)`/`@MaxLength(15)` y `@IsOptional()`, y un test e2e que exija 400 para el payload con operador. **Hallazgo hermano, mismo origen**: `POST /api/tickets/:id/notas` toma `@Body('nota')` sin DTO ni longitud máxima (`tickets.controller.ts:205-213`), y `CreateTicketDto.titulo`/`notaCliente`/`notasInternas` no tienen `@MaxLength` (`dto/ticket.dto.ts:126-137`): un documento puede crecer hasta el tope de 16 MB de Mongo.
- **✅ Corregido (2026-10-25)**: `LookupPublicTicketDto` (`codigo`/`telefono`: `@IsString` + `@IsNotEmpty` + `@MaxLength(40)`) hace que la entrada inválida devuelva **400** con mensaje en español en vez de 500, y `POST /api/tickets/:id/notas` pasó de `@Body('nota')` a `AddTicketNoteDto` (`@IsString` + `@IsNotEmpty` + `@MaxLength(2000)`). Verificado en `tickets.e2e-spec.ts` y en `e2e/tests/security-contract.spec.ts` (el caso que antes devolvía 500 ahora exige 400).
- **Sobre los `@MaxLength` de `CreateTicketDto`** (título, `notaCliente`, `notasInternas`): **no** se agregaron. El escenario de 16 MB no es alcanzable por HTTP porque Nest usa `body-parser` con el límite por defecto de **100 kB**, así que el riesgo real es el ruido de validación, no el tamaño del documento. Queda como mejora de higiene, no como vulnerabilidad.

### R-07 — `mustChangePassword` solo se aplica en el cliente (severidad baja)

- **Qué pasa**: al crear personal o resetear su contraseña se marca `mustChangePassword: true` (`staff.use-cases.ts:55,123`) y se devuelve en `/auth/me`, pero **ningún** guard lo verifica (`session.guard.ts` no lo mira). La única barrera es el modal del panel (`frontend/src/admin/auth/components/MustChangePasswordModal.jsx:15-17`).
- **Impacto**: un `admin` con contraseña temporal puede seguir usando la API indefinidamente sin cambiarla, incluido `POST /api/tickets/:id/reveal-clave`. Es una política que no se cumple, no una puerta abierta.
- **Probabilidad**: baja (requiere que el usuario ignore el modal, que cubre la pantalla completa).
- **Recomendación**: rechazar con 403 cualquier ruta distinta de `/auth/me` y `/account/password` mientras `mustChangePassword` sea `true`, en el `SessionGuard`.
- **⏳ Sigue abierto (2026-10-25)** a propósito: es un cambio de comportamiento con riesgo de dejar a alguien encerrado fuera de la única ruta que le permite cumplir la política, y merece su propio test y su propia revisión. Hoy la única barrera sigue siendo el modal del panel, que cubre la pantalla completa.

### R-08 — Contraseñas temporales de 6 caracteres y `.env.example` desactualizado (severidad baja)

- **Qué pasa**: el reset de personal exige mínimo 6 caracteres (`backend/src/staff/dto/reset-password.dto.ts:5-7`) mientras el cambio propio exige 8 (`backend/src/account/dto/update-password.dto.ts:8-10`); no hay política de complejidad, caducidad ni verificación contra listas de contraseñas filtradas. Por otro lado, `backend/.env.example` solo documenta `SESSION_SECRET` y credenciales de bootstrap (`backend/.env.example:1-18`) y omite `JWT_SECRET`, `TICKET_SECRET_KEY`, `KAPSO_*`, `PUBLIC_SITE_URL` y `WHATSAPP_AUTO_TICKET_LISTO`.
- **Impacto**: una temporal débil en un panel con acceso a claves de equipos; y un alta de entorno que falla al arrancar (comportamiento correcto) pero sin decir qué falta, lo que empuja a "arreglarlo" poniendo un secreto corto.
- **Probabilidad**: media para el `.env.example` (le pasa a cualquier dev nuevo); baja para la contraseña débil.
- **Recomendación**: unificar el mínimo en 8 (idealmente 12 para `owner`) y generar la temporal en el servidor; actualizar `.env.example` con todas las variables que `env.validation.ts` conoce y una nota de que `TICKET_SECRET_KEY` es obligatoria y sin fallback.
- **✅ Corregido (2026-10-25)**: el mínimo es **8** en el alta de personal, en el reset del `owner` y en el cambio propio, con mensaje en español (`create-staff.dto.ts`, `reset-password.dto.ts`). `.env.example` documenta ahora `JWT_SECRET` (canónico, ≥32, sin fallback), `TICKET_SECRET_KEY` (≥32, sin fallback e independiente a propósito), `TRUST_PROXY_HOPS` y deja `SESSION_SECRET=` vacío y marcado como **deprecado**. Verificado en `password-hardening.e2e-spec.ts` (7 caracteres rechazados en las tres rutas) y en el límite de 10/min de las dos rutas de cuenta.

### R-09 — Riesgos no verificables desde el repositorio

- **Backups, restauración, cifrado en reposo y ACL de red de Atlas**: no hay configuración en el repo; no puedo afirmar que existan ni que se hayan probado. *Recomendación*: documentar la política (frecuencia, retención, prueba de restauración) y verificarla una vez por trimestre.
- **Rotación de secretos**: no hay procedimiento escrito. `TICKET_SECRET_KEY` es especialmente delicada: rotarla invalida la lectura de todas las claves ya cifradas (los tickets en curso quedarían con clave ilegible, sin migración). *Recomendación*: versionar la clave (`TICKET_SECRET_KEY_V2` + `keyId` en el documento) antes de necesitar rotarla.
- **Recuperación de contraseña**: no existe flujo por correo; hoy la única recuperación es que un `owner` resetee (`staff.controller.ts:96-106`). Si se pierde el último `owner`, no hay autoservicio (solo `ADMIN_*` + colección vacía, `bootstrap-admin.use-case.ts:31-34`). Es una decisión de producto, no un bug.
- **Dependencias**: no se corrió `pnpm audit` en este pase; no hay informe de vulnerabilidades de terceros en el repositorio.

---

## 7. Checklist previo a cada despliegue

Lo que un operador debe mirar antes de publicar, en orden. Fallar cualquiera de los tres primeros impide desplegar.

1. **Variables obligatorias presentes** en el entorno del backend: `MONGODB_URI`, `JWT_SECRET` (o el alias `SESSION_SECRET`, que emite un warning), `TICKET_SECRET_KEY` (`backend/src/shared/config/env.validation.ts:22-24,109-125`).
2. **Longitud de secretos**: `JWT_SECRET` y `TICKET_SECRET_KEY` ≥ 32 caracteres (`backend/src/shared/config/secrets.ts:1-2,33-37,58-62`). Si el arranque falla por esto, **no** acortar el secreto: generar uno nuevo.
3. **`NODE_ENV=production`** en el backend. Es lo que activa `secure` en la cookie (`auth.controller.ts:49,54`); sin él la cookie viaja sin `Secure`. Verificar tras el deploy con `Set-Cookie` en el login: debe contener `Secure`, `HttpOnly` y `SameSite=Lax`.
4. **Secretos independientes**: confirmar que `TICKET_SECRET_KEY ≠ JWT_SECRET` (no lo impone el código; sí lo exige el ADR 0025). Si alguien rotó una, revisar que no copió la otra.
5. **`BACKEND_URL` definida** en el proyecto de Vercel del frontend; sin ella el build falla a propósito (`frontend/vercel.ts:29-38`).
6. **`.env` no versionado**: `git status` no debe mostrar `backend/.env` (ignorado por `backend/.gitignore:6`).
7. **Suite de seguridad en verde** antes de tagear: `cd backend && pnpm test:e2e -- security` (33/33). Si falla un caso de cookie, revisar `NODE_ENV` antes de tocar el test.
8. **Webhook de Kapso**: si `KAPSO_WEBHOOK_SECRET` está definida, comprobar que el panel de Kapso apunta a `/api/webhooks/kapso` con el mismo valor; si no lo está, el endpoint responde 503 (correcto) y las plantillas no actualizan estado.
9. **Cabeceras después del deploy**: `curl -sI https://www.armalytech.com/ | findstr /i "x-frame x-content referrer permissions strict"` debe mostrar las cinco. Si faltan, el deploy no tomó el `add_header` de nginx o el `routes.header` de Vercel.
10. **`TRUST_PROXY_HOPS`**: en producción debe quedar en **1** (o sin definir, que ya es el default con `NODE_ENV=production`). Si se deja en 0 detrás de nginx, todos los clientes comparten el cubo del throttler y un solo atacante puede bloquear el login de todo el taller durante 60 s. Verificarlo mirando el log de un 429: la IP no debe ser la del contenedor.
11. **Sesión revocable**: entrar al panel, copiar la cookie desde el navegador, cerrar sesión y repetir `GET /api/auth/me` con la cookie copiada. Debe responder `401`. Si responde `200`, el logout dejó de revocar y R-01 volvió.
12. **Estado de salud después del deploy**: `curl -s -o /dev/null -w '%{http_code}' https://www.armalytech.com/api/staff` debe dar `401` y `/api/health` debe dar `200`. En los logs, buscar `Missing JWT signing secret`, `TICKET_SECRET_KEY must be set`, `invalid_signature` repetidos e `Internal server error` (un 500 en una ruta pública es un bug de validación, no ruido aceptable).

---

## 8. Cómo reproducir esta revisión

Requisitos: Node 22, pnpm, y el binario de `mongodb-memory-server` cacheado (se descarga solo en el primer `pnpm install`).

```bash
cd backend
pnpm install

# 1. La suite de ataques (13-15 s; levanta su propio Mongo en memoria)
pnpm test:e2e -- security

# 2. Solo los unitarios de cifrado y de exposición pública
pnpm test -- ticket-cipher
pnpm test -- ticket.use-cases

# 3. Webhook: firma, replay e idempotencia
pnpm test:e2e -- kapso

# 4. Autorización por rol (403 de admin en rutas de owner)
pnpm test:e2e -- tickets

# 5. Toda la batería e2e
pnpm test:e2e
```

Los scripts existen en `backend/package.json:16-19` (`test`, `test:e2e`) y el argumento posicional funciona porque Jest lo trata como *test path pattern* (config en `backend/test/jest-e2e.json:5`, `testRegex: .e2e-spec.ts$`).

**Si falla:**

- **`TICKET_SECRET_KEY must be set`**: el entorno de test debería inyectarla sola (`backend/test/test-app.ts:26-27`); si el error aparece, hay un `.spec.ts` instanciando el servicio sin `ConfigService` falso.
- **`Timeout` de `mongodb-memory-server`**: falta el binario; ejecutar `pnpm install` con red o predescargarlo (`MONGOMS_DOWNLOAD_URL`).
- **Un caso de cookie falla por `Secure`**: `NODE_ENV` no es `test`; `test-app.ts:29` lo fuerza, así que el fallo suele venir de ejecutar el spec fuera del helper.
- **429 inesperado en el bloque de login**: otra suite consumió el cubo del *throttler* en la misma IP. Es la razón por la que cada `describe` arranca su propia app (`security.e2e-spec.ts:12-15`); no subir el límite para "arreglarlo". Regla del repo: si un test de seguridad falla, no se cambia la expectativa, se entiende por qué falla (`CLAUDE.md` §8).

---

## 9. Registro de cambios del documento

| Fecha | Cambio |
|---|---|
| 2026-10-25 | Versión inicial. Revisión de código de `auth`, `shared`, `tickets`, `community`, `whatsapp`, `account`, `staff`, `frontend/vercel.ts`, `backend/vercel.json`, `frontend/api/contact.js` y del proxy nginx; ejecución de `security.e2e-spec.ts` (30/30) y verificación pasiva en producción. Nueve riesgos residuales documentados (R-01 a R-09); ninguno corregido en ese pase. |
| 2026-10-25 | **Pase de endurecimiento.** Se corrigieron R-01 (logout revoca por `tokenVersion` + throttle en las rutas de cuenta), R-02 (proyección mínima en el registro público y sin sobrescritura de nombres), R-03 (allowlist de CORS, sin credenciales, 5/10 min y topes en `/api/contact`), R-04 (`trust proxy` configurable con test discriminante), R-06 (`LookupPublicTicketDto` + `AddTicketNoteDto`), R-08 (mínimo 8 y `.env.example` completo) y parcialmente R-05 (cinco cabeceras en nginx y Vercel, `x-powered-by` deshabilitado). Siguen abiertos **R-05 (CSP + casos XSS)**, **R-07 (`mustChangePassword` en servidor)** y **R-09** (no verificable desde el repo). Suite de seguridad: 30 → **33 tests**, todos en verde. Contrato y evidencia en [odd/tasks/seguridad-hardening-2026-10-25.md](odd/tasks/seguridad-hardening-2026-10-25.md). |
