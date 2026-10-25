# Despliegue

Cómo se publica ArmalyTech y cómo se verifica que quedó publicado. Este documento es el
**protocolo de despliegue**: si algo de aquí no coincide con lo que ves, el documento está mal y hay
que corregirlo en el mismo cambio que arregla el despliegue.

- **Sitio en producción:** <https://www.armalytech.com>
- **Salud del backend:** <https://www.armalytech.com/api/health> → `{"ok":true,"data":{"status":"ok","db":{...}}}`

---

## 1. Topología

El producto son dos contenedores y una base de datos gestionada:

```
                    ┌───────────────────────────────┐
   navegador  ───▶  │  frontend (nginx, :80)        │   estáticos + /api/* proxy
                    │  dist/ (13 rutas prerender)   │
                    └───────────────┬───────────────┘
                                    │  BACKEND_URL
                    ┌───────────────▼───────────────┐
                    │  backend (node, :3000)        │   NestJS, prefijo /api
                    │  dist/src/main.js             │
                    └───────────────┬───────────────┘
                                    │  MONGODB_URI
                    ┌───────────────▼───────────────┐
                    │  MongoDB Atlas (M0 free tier) │
                    └───────────────────────────────┘
```

El frontend **proxya** los prefijos `/api/*` hacia el backend, no lo llama cross-origin. Eso es
deliberado: la sesión del panel vive en una cookie `httpOnly` y `sameSite=lax`, así que navegador y
API tienen que compartir origen o la cookie no viaja ([ADR 0021](docs/adrs/0021-autenticacion-jwt-en-cookie.md)).

La lista de prefijos proxeados existe **tres veces** y las tres deben coincidir:

| Archivo | Para qué |
|---|---|
| [frontend/vercel.ts](frontend/vercel.ts) (`BACKEND_PREFIXES`) | rewrites de Vercel |
| [frontend/vite.config.js](frontend/vite.config.js) (regex de `server.proxy`) | desarrollo local |
| [frontend/nginx/default.conf.template](frontend/nginx/default.conf.template) (`location ~ ^/api/(...)`) | contenedor de producción |

Si agregas un módulo nuevo al backend y olvidas una de las tres, la ruta devuelve el HTML del SPA
con HTTP 200 y la feature "no funciona" sin ningún error de red visible.

## 2. Caminos de despliegue

Hay dos configuraciones en el repo. La **vigente** es la de contenedores; la de Vercel se mantiene
porque parte del proyecto nació ahí.

### 2.1 Contenedores (Dokploy) — vigente

Cada servicio tiene su propio `Dockerfile` multi-stage:

- [backend/Dockerfile](backend/Dockerfile): `node:22-bookworm-slim`, instala dependencias con
  `--frozen-lockfile`, compila, `pnpm prune --prod`, y arranca `node dist/src/main.js`.
  El entry **queda en `dist/src`** porque el `tsconfig` no fija `rootDir` y también compila `api/`.
- [frontend/Dockerfile](frontend/Dockerfile): build con Vite (+ prerender), servido por
  `nginx:1.27-alpine` con [default.conf.template](frontend/nginx/default.conf.template) procesado por
  `envsubst`, que es lo que lee `BACKEND_URL`.

En Dokploy, cada servicio se configura como aplicación con **Build Type = Dockerfile** y el
**Dockerfile Path** apuntando al de su carpeta (`backend/Dockerfile`, `frontend/Dockerfile`). La raíz
de cada build es la carpeta del servicio, no la raíz del repo.

> Verifica en el panel de Dokploy cuál es el trigger configurado (push a `main`/`cambiosNuevos` o
> deploy manual) antes de asumir que un `git push` publica solo. Este documento no lo fija porque
> cambia por proyecto y no está versionado en el repo.

### 2.2 Vercel (heredado)

Se mantiene funcional y documentado en [ADR 0002](docs/adrs/0002-despliegue-vercel-free-tier.md):

- Frontend: proyecto estático. `vercel.ts` se compila en build time y arma los rewrites hacia
  `BACKEND_URL`; **el build falla a propósito si `BACKEND_URL` no está definida**.
- Backend: función serverless (`backend/api/index.ts` + [backend/vercel.json](backend/vercel.json)),
  que envuelve la app de Nest con `serverless-http` y una instancia cacheada entre invocaciones.

## 3. Variables de entorno

### Backend (obligatorias — el arranque falla si faltan o son inválidas)

| Variable | Regla |
|---|---|
| `MONGODB_URI` | Cadena de Atlas. Sin valor por defecto. |
| `JWT_SECRET` | Firma la cookie de sesión. **≥ 32 caracteres**, largo y aleatorio. |
| `TICKET_SECRET_KEY` | Cifra la clave del equipo (AES-256-GCM). **≥ 32 caracteres. No tiene fallback**: no se deriva de `JWT_SECRET` ni hay valor por defecto ([ADR 0025](docs/adrs/0025-integracion-tickets-clientes-inventario-historial.md)). |
| `NODE_ENV` | `production` en servidor. Es lo que hace la cookie `Secure`. |
| `ADMIN_USERNAME` · `ADMIN_PASSWORD` | Solo se usan **una vez**, al crear la cuenta `owner` cuando la colección está vacía. |
| `PORT` | El contenedor escucha en `3000` (el `Dockerfile` ya lo fija). |
| `TRUST_PROXY_HOPS` | Cuántos proxies confiar para leer la IP del cliente. **En producción: `1`** (o sin definir: ya es el default con `NODE_ENV=production`). En `0` detrás de nginx, todos los clientes comparten el cubo del throttler y un atacante puede bloquear el login de todo el taller por 60 s. |

Opcionales: `SESSION_MAX_AGE_SECONDS` (default 12 h), `PUBLIC_SITE_URL` (enlaces en mensajes de
WhatsApp), `KAPSO_*` (sin credenciales el backend arranca con un sender no-op y el envío responde
503), `N8N_WEBHOOK_URL*` y `WHATSAPP_AUTO_TICKET_LISTO`. La referencia completa es
[backend/.env.example](backend/.env.example).

> `SESSION_SECRET` sigue aceptándose como alias deprecado de `JWT_SECRET`, con un warning en el
> arranque. Si tocas ese entorno, renómbrala.

### Frontend

| Variable | Regla |
|---|---|
| `BACKEND_URL` | Origen del backend **sin barra final**. Obligatoria: `vercel.ts` la exige y el template de nginx la usa como upstream. |

`frontend/.env` (desarrollo) apunta a `http://localhost:3001`; `frontend/.env.e2e` apunta al backend
desechable de Playwright en `3100`. Ninguno de los dos se usa en producción.

## 4. Procedimiento de release

1. **Verificar en verde antes de publicar.** El workflow de CI
   ([.github/workflows/ci.yml](.github/workflows/ci.yml)) corre lint, build y las tres suites
   (unitarias, e2e de Jest, e2e de Playwright). No publiques con el CI en rojo.
2. **Revisar variables de entorno.** Si el release agrega una variable nueva, agrégala en Dokploy
   **antes** de desplegar: la validación de entorno es fail-fast, así que el contenedor no arranca.
3. **Desplegar el backend primero**, luego el frontend. Al revés, el frontend nuevo podría llamar a
   rutas que el backend viejo todavía no tiene y devuelve el HTML del SPA.
4. **Verificar** (ver §5).
5. **Si algo falla**, volver a la imagen anterior desde Dokploy (rollback por imagen, no por revert de
   git) y abrir un ADR o una nota en `odd/tasks/` con lo que pasó.

## 5. Verificación post-despliegue

Estos cuatro chequeos cubren el 90% de los despliegues rotos. Los tres primeros se pueden correr a
mano; el último es la suite completa.

```bash
# 1. El backend vive y habla con Mongo.
curl -s https://www.armalytech.com/api/health
# → {"ok":true,"data":{"status":"ok","db":{"state":"connected","readyState":1}}}

# 2. El proxy del frontend llega al backend (no devuelve el HTML del SPA).
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://www.armalytech.com/api/auth/me
# → 401 (JSON). Si sale 200 y content_type text/html, el prefijo no está proxeado.

# 3. Las cabeceras de seguridad están puestas (R-05).
curl -sI https://www.armalytech.com/ | grep -iE "x-content-type-options|referrer-policy|x-frame-options|permissions-policy|strict-transport-security"
# → cinco líneas. Si falta alguna, el deploy no tomó el add_header de nginx.

# 4. La home responde y está prerenderizada (SEO).
curl -s https://www.armalytech.com/ | grep -o '<title>[^<]*</title>'

# 5. El flujo completo, en un navegador real y contra un backend desechable.
cd e2e && pnpm test
```

Y a mano en el navegador: entrar a `/admin/login`, iniciar sesión, crear un ticket de prueba, abrir
`/consultar-ticket`, buscar ese ticket con el celular registrado y confirmar que la página pública
muestra el estado correcto. **Cerrar sesión y comprobar que reentrar pide credenciales** (el logout
revoca el token; si te deja pasar, R-01 volvió). Borrar el ticket de prueba no es necesario: el ciclo de
abandono lo marca solo ([ADR 0007](docs/adrs/0007-estados-del-ticket.md)).

## 6. Rollback

| Caso | Acción |
|---|---|
| El frontend quedó roto | Redeploy de la imagen anterior en Dokploy. Los estáticos son inmutables por hash, así que no hay caché que invalidar más allá del HTML (`no-cache` ya está configurado en nginx). |
| El backend quedó roto | Redeploy de la imagen anterior. Las migraciones son aditivas; no hay migraciones destructivas en el repo. |
| Un secreto se filtró | Rotar `JWT_SECRET` invalida todas las sesiones al instante (basta con reiniciar: la firma vieja deja de verificar y el guard responde 401). Rotar `TICKET_SECRET_KEY` **inutiliza las claves de equipo ya cifradas**: es una operación con pérdida de datos, no la hagas sin un plan. |
| Datos corruptos | No hay backups automáticos ([ADR 0003](docs/adrs/0003-base-de-datos-mongodb-atlas.md), decisión explícita). La vía de recuperación es el `--dry-run` del script de migración y la reimportación desde la SQLite original. |

## 7. Qué NO automatiza el CI

El pipeline corre lint, build y tests en cada push y PR, **pero no despliega**: el despliegue es una
acción explícita desde Dokploy (o Vercel). Si en algún momento se agrega CD, el paso debe quedar
después de la suite de Playwright y nunca antes de que el backend esté sano.
