# Feature: hardening de seguridad + corrección de dirección (2026-10-25)

Origen: [SECURITY.md](../../SECURITY.md) (riesgos R-01…R-09) y la revisión de dirección de
[BACKLOG.md](../../BACKLOG.md) (P1-3). Decisión del dueño en esta sesión: la dirección correcta es
**Av. San Luis 1849-1851** (antes convivían 1859 y 1873).

Regla de git vigente: **nadie commitea** ([CLAUDE.md](../../CLAUDE.md) §1). Cambios en el working tree.

## Contrato (fuente de verdad para los dos escritores)

### C1 — `POST /api/auth/logout` revoca de verdad

Hoy solo borra la cookie: un token copiado sigue sirviendo hasta 12 h. El guard **ya** compara
`tokenVersion` ([session.guard.ts](../../backend/src/auth/infrastructure/session.guard.ts)), así que el
logout debe incrementarlo.

- Ruta pasa a `@Public()`: siempre responde `200 { ok: true }` y **siempre** limpia la cookie, incluso
  sin sesión (idempotente, no filtra si había sesión).
- Si hay cookie válida: incrementa `tokenVersion` del usuario (invalida todas sus sesiones) y registra
  el evento si ya existe un logger/uso establecido para auth; si no existe, no inventarlo.
- `@Throttle({ default: { limit: 30, ttl: 60_000 } })`.
- Sin cambios en la forma de la respuesta: `{ ok: true }`.

### C2 — Throttle donde se verifica contraseña

- `PATCH /api/account/password` y `PATCH /api/account/email` → `@Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- Sin cambios de contrato.

### C3 — Contraseña temporal mínima de 8

- El alta de personal y el reset del `owner` pasan de `@MinLength(6)` a `@MinLength(8)`, alineado con el
  cambio de contraseña propio.
- Mensaje de error en español. Sin otros cambios.

### C4 — `POST /api/community/register` deja de devolver el cliente completo

Hoy responde el documento entero (`phoneE164`, `consentAt`, fechas, `visitCount`) y **sobrescribe**
nombre/apellido cuando el teléfono ya existe.

- **No** se sobrescriben `firstName`/`lastName` de un cliente existente.
- Respuesta pública, solo proyección:
  ```json
  { "ok": true, "data": { "client": { "firstName": "Ana", "stamps": 3 }, "isNewClient": false } }
  ```
  Nada más: sin `phoneE164`, sin `consentAt`, sin fechas, sin `visitCount`, sin `lastName`.
- El frontend solo lee `data.isNewClient`, `data.client.firstName` y `data.client.stamps`
  ([RegisterPage.jsx](../../frontend/src/community/RegisterPage.jsx)).
- `@Throttle` del registro baja a `limit: 5, ttl: 60_000`.

### C5 — `POST /api/tickets/public/lookup` valida la entrada

Hoy no tiene DTO: un `codigo` no-string revienta en 500.

- Nuevo `LookupPublicTicketDto`: `codigo` y `telefono` `@IsString()` + `@MaxLength(40)`, ambos
  obligatorios (`@IsNotEmpty`). Entrada inválida → **400** con el mensaje en español, nunca 500.
- El comportamiento funcional no cambia (sigue exigiendo código + celular y normalizando a dígitos).

### C6 — `POST /api/contact` (serverless del frontend) deja de ser un relay abierto

- CORS con **allowlist** de orígenes (`https://www.armalytech.com`, `https://armalytech.com`,
  `http://localhost:5173`, `http://127.0.0.1:5173`). Origen desconocido → sin cabeceras CORS.
- Se elimina `Access-Control-Allow-Credentials` (el formulario es same-origin y no usa cookies).
- Límite de tasa en memoria por IP: **5 envíos / 10 min**; al exceder → `429` con mensaje en español.
- Topes de longitud (`name` 80, `phone` 30, `email` 120, `message` 2000) y validación de formato de
  email; se rechaza con `400`.
- Los secretos siguen saliendo de `process.env`; no se imprime ninguno.

### C7 — Cabeceras de seguridad en el frontend

En [nginx/default.conf.template](../../frontend/nginx/default.conf.template) y en
[vercel.ts](../../frontend/vercel.ts), para todas las respuestas:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: SAMEORIGIN
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Sin CSP todavía**: el sitio usa JSON-LD inline, un iframe de Google Maps y el widget de WhatsApp; una
CSP estricta exige nonces y QA visual. Se documenta como pendiente consciente, no se finge.

### C8 — Dirección

Único valor válido: **Av. San Luis 1849-1851**. Se cambia solo el número; se conserva la estructura de
cada texto (con o sin "Tienda 127"). Aplica a `frontend/src/**` (textos, `ADDRESS`, JSON-LD, metas) y a
los dos places del ticket que aún decían 1859. **No** tocar:
- `https://www.google.com/maps/embed?...` (coordenadas; contienen `1859796`, no es la dirección),
- `design/**` (prototipos históricos),
- `reports/**` y `research_notes/**` (investigación fechada; el orquestador la referencia, no la reescribe).

### C9 — `trust proxy` para que el throttle por IP sea fiable

`ThrottlerGuard` usa `req.ip`, pero el backend nunca configura `trust proxy` mientras nginx y Vercel
reenvían `X-Forwarded-For` (R-04).

- `app.set('trust proxy', hops)` en el bootstrap, con `TRUST_PROXY_HOPS` de entorno.
- Default: **1 en producción, 0 en test/desarrollo** (en tests no hay proxy; confiar en la cabecera
  permitiría falsificar la IP y saltarse el throttle).
- Opcional numérico en `env.validation.ts`; documentada en `.env.example` y en `backend/README.md`.

## Tareas

| ID | Tarea | Dueño | Alcance |
|---|---|---|---|
| B1 | C1 logout revoca | escritor backend | `backend/src/auth/**` |
| B2 | C2 throttle cuenta + C3 mínimo 8 | escritor backend | `backend/src/account/**`, `backend/src/staff/**` |
| B3 | C4 registro público | escritor backend | `backend/src/community/**` |
| B4 | C5 DTO del lookup público | escritor backend | `backend/src/tickets/infrastructure/**` |
| B5 | Tests de los cuatro cambios | escritor backend | `backend/src/**/__tests__`, `backend/test/**` |
| B6 | `.env.example` completo (JWT_SECRET, TICKET_SECRET_KEY) | escritor backend | `backend/.env.example` |
| B7 | C9 `trust proxy` + `TRUST_PROXY_HOPS` | escritor backend | `backend/src/create-nest-app.ts`, `shared/config/**`, `README.md` |
| F1 | C8 dirección (incluye tickets) | escritor frontend | `frontend/src/**` |
| F2 | C6 `/api/contact` | escritor frontend | `frontend/api/contact.js` |
| F3 | C7 cabeceras (+ HSTS) | escritor frontend | `frontend/nginx/**`, `frontend/vercel.ts` |
| O1 | Revisar hand-offs, actualizar SECURITY.md / BACKLOG / DESIGN / REVIEWS, gates finales | orquestador | docs + `e2e/**` |

## Verificación

- Backend: `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"`, `pnpm build`, `pnpm test`, `pnpm test:e2e`.
- Frontend: `pnpm lint` (max-warnings 0), `pnpm build`.
- E2E: `cd e2e && pnpm test`.
- Grep de cierre: `rg "1859|1873" frontend/src` sin resultados; `rg "1849-1851" frontend/src` con los
  archivos esperados.

## Evidencia (cierre 2026-10-25)

Todo quedó en el working tree, sin commit. Los cuatro comandos del backend y los dos del frontend se
corrieron **sobre el árbol terminado**, más la suite de Playwright:

| Verificación | Resultado |
|---|---|
| `backend: pnpm exec eslint` | 0 errores, 0 warnings |
| `backend: pnpm build` | OK |
| `backend: pnpm test` | 29 suites · **230** tests (antes 28 · 226) |
| `backend: pnpm test:e2e` | 10 suites · **88** tests (antes 9 · 74) |
| `backend: pnpm test:e2e -- security` | 1 suite · **33** tests (antes 30) |
| `frontend: pnpm lint` | 0 warnings |
| `frontend: pnpm build` | OK · 13 rutas prerenderizadas |
| `e2e: pnpm test` | **16** tests (antes 11) |

**Dirección:** 24 apariciones corregidas en 14 archivos de `frontend/src`. En el HTML prerenderizado:
20 apariciones de `1849-1851` y **0** de los números anteriores. Los cuatro restos de `1859` en
`frontend/src` son las coordenadas de `google.com/maps/embed` (`1d289.9719361859796`), no la
dirección.

**Tareas:** B1–B9 y F1–F3 cerradas; O1 (esta actualización y los gates) cerrada. `SECURITY.md` con la
tabla de estado §6.1, `docs/REVIEWS.md` con la revisión R-2026-10-25b, y `BACKLOG.md` / `DESIGN.md` /
`seo-mejoras-competencia.md` actualizados con la decisión de la dirección.

**Queda abierto a propósito:** CSP estricta (necesita nonces + QA visual), `mustChangePassword` en el
servidor (riesgo de encerrar al usuario) y los `@MaxLength` de `CreateTicketDto` (inalcanzables por el
límite de 100 kB de `body-parser`).
