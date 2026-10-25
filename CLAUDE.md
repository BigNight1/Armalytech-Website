# CLAUDE.md — ArmalyTech Website

Guía operativa para cualquier agente (Claude, Cursor, Copilot, subagentes) que trabaje en este
repo. No es un README: es el contrato de cómo se trabaja aquí. Si algo de este archivo contradice
un impulso genérico tuyo, gana este archivo.

Producto: sitio público de reparación de celulares (Lima, Perú) + **panel administrativo** para el
taller (tickets, inventario, historial de caja, clientes) + **página pública de seguimiento** de un
ticket por enlace opaco.

---

## 1. Regla de oro: no commitees

**Nunca ejecutes `git commit`, `git push`, `git merge`, `git rebase`, `git reset` ni `git stash`
salvo que el usuario lo pida explícitamente en el mensaje actual.** Deja los cambios en el working
tree y reporta qué archivos tocaste. Aplica a todos los subagentes: incluye esta regla en cada
delegación.

Comandos de git de solo lectura (`status`, `diff`, `log`, `show`) están permitidos siempre.

Cuando el usuario sí pida commitear: **Conventional Commits**, sin `Co-Authored-By` ni atribución a
IA.

> Copia con ámbito reducido en [.claude/CLAUDE.md](.claude/CLAUDE.md) (se carga al trabajar bajo
> `.claude/`). Si cambias la regla, cámbiala en los dos.

## 2. Mapa del repo

| Ruta | Qué es | Stack |
|---|---|---|
| `frontend/` | Sitio público + panel admin (`/admin/*`) + ticket público (`/ticket/:token`) + registro QR (`/registrar/usuario`). Un solo build de Vite. | React 18 + Vite + Tailwind + React Query |
| `backend/` | API REST bajo `/api` (prefijo global). | NestJS 10 + Mongoose + MongoDB Atlas |
| `e2e/` | Suite Playwright: flujo público del ticket + flujo del panel. | @playwright/test |
| `docs/adrs/` | 29 ADRs (MADR). La decisión, no el cómo. | Markdown |
| `PRD.md` · `DESIGN.md` · `TECH-DESIGN.md` · `BACKLOG.md` · `SECURITY.md` | Pipeline documental: producto → diseño → arquitectura → trabajo → seguridad. | Markdown |
| `odd/tasks/` | Specs de feature: contrato de API, fases, tareas y **Evidencia** por tarea. | Markdown |
| `design/` | Briefs + prototipos HTML de referencia (Claude Design). No se ejecuta. | HTML |
| `reports/`, `research_notes/` | Investigación de competencia y SEO que originó las tareas de SEO. | Markdown |

Cada documento responde al anterior. Si cambias una decisión de producto, el orden de actualización
es: `PRD.md` → `DESIGN.md` (si toca interfaz) → ADR nuevo en `docs/adrs/` → `TECH-DESIGN.md` →
`odd/tasks/` → código. Un cambio de alcance que no quede en el PRD no existe.

## 3. Comandos

```bash
# backend/
pnpm install
pnpm start:dev              # http://localhost:3000/api
pnpm build                  # nest build → dist/  (ojo: el entry queda en dist/src/main.js)
pnpm test                   # unitarios (casos de uso contra repos fake en memoria)
pnpm test:e2e               # e2e (supertest + mongodb-memory-server)
pnpm exec eslint "{src,apps,libs,test}/**/*.ts"   # lint SIN --fix (lo que corre CI)
pnpm lint                   # igual pero con --fix
pnpm migrate:sqlite -- ./inventario.db --dry-run

# frontend/
pnpm install
pnpm dev                    # Vite en 5173, proxy /api → BACKEND_URL (default 3001 por .env)
pnpm lint                   # eslint --max-warnings 0 (CI falla con cualquier warning)
pnpm build                  # vite build + prerender de 13 rutas (scripts/prerender.mjs)

# e2e/  (arranca su propio backend y su propio Vite; no necesitas nada levantado)
pnpm install
pnpm exec playwright install chromium
pnpm test
pnpm report
```

## 4. Arquitectura del backend: no improvises capas

Limpia por feature, con estructura gritona ([ADR 0020](docs/adrs/0020-arquitectura-limpia-por-feature.md)):

```
src/<feature>/
  domain/          entidades, value objects, PUERTOS de repositorio, errores de dominio
                   → cero imports de @nestjs, mongoose o express
  application/     un caso de uso por clase; solo depende de puertos del dominio (tokens DI)
  infrastructure/  esquemas Mongoose, adaptadores que implementan los puertos,
                   controladores + DTOs, y el módulo Nest que cablea tokens → adaptadores
```

**Regla de dependencia: `infrastructure → application → domain`. Nunca al revés.** Si te encuentras
importando `@nestjs/mongoose` desde `domain/`, estás en el lugar equivocado.

Para agregar un endpoint: puerto en `domain/` → caso de uso en `application/` → adaptador + DTO +
controlador en `infrastructure/` → registro en el `<feature>.module.ts`. Las sesiones y los roles se
resuelven con el `SessionGuard` global + `@Roles(...)`; una ruta pública necesita `@Public()`
explícito.

## 5. Convenciones

- **Código en inglés, textos de interfaz en español.** Variables, tipos, comentarios: inglés.
  Todo lo que ve el usuario final: español.
- **Frontend en JSX (JS), backend en TypeScript.** No migres el frontend a TS en un cambio de paso.
- **Comentarios que explican el *por qué*, no el *qué*.** Los ADR y los `odd/tasks` son la fuente;
  cita el número de ADR cuando la decisión no sea obvia (`// ADR 0025: …`).
- **Los errores de dominio se traducen a HTTP en un solo lugar**:
  `shared/infrastructure/http-exception.filter.ts`. No armes `try/catch` que devuelva respuestas a
  mano en los controladores.
- **Los números de dinero se calculan en el servidor.** El cliente manda el método de pago, nunca el
  monto del saldo.

## 6. Trampas reales de este repo (aprendidas a golpes)

1. **Tres listas de prefijos `/api/*` deben moverse juntas.** Si agregas un módulo nuevo al backend,
   actualiza `BACKEND_PREFIXES` en [frontend/vercel.ts](frontend/vercel.ts), la regex de proxy en
   [frontend/vite.config.js](frontend/vite.config.js) y la regex `location` de
   [frontend/nginx/default.conf.template](frontend/nginx/default.conf.template). Si olvidas una, la
   ruta devuelve el HTML del SPA con status 200 y la feature "no funciona" sin ningún error de red.
   Ya pasó con `/api/technicians`, `/api/cobros` y `/api/sales`.
2. **`BACKEND_URL` es obligatoria en el build del frontend.** `vercel.ts` lanza una excepción si no
   está definida; es a propósito (antes era un placeholder que se olvidaba editar).
3. **`NODE_ENV=test` hace que el backend ignore `backend/.env`.** Es lo que permite que los tests
   nunca toquen Atlas ni Kapso. No lo quites.
4. **`TICKET_SECRET_KEY` no tiene fallback.** Es independiente de `JWT_SECRET` a propósito: si
   derivara de él, quien lea el código podría descifrar las claves de los equipos (ADR 0025).
   Mínimo 32 caracteres; el arranque falla si falta.
5. **El build del backend emite `dist/src/main.js`**, no `dist/main.js` (el tsconfig no fija
   `rootDir` y también compila `api/`). El `CMD` del Dockerfile depende de eso.
6. **El shell del SPA es `dist/app-shell.html`, no `index.html`.** `index.html` es la home
   prerenderizada. Si cambias el fallback del rewrite/`try_files`, rompes el SEO.
7. **`POST /api/auth/login` está limitado a 5 requests/minuto por IP.** No agregues logins a los
   tests: la suite de Playwright hace uno solo en `e2e/global-setup.ts` y reutiliza la cookie.
8. **`mongodb-memory-server` descarga un binario de MongoDB.** En Docker se desactiva con
   `MONGOMS_DISABLE_POSTINSTALL=1` (ya está en el Dockerfile); en local queda cacheado en
   `~/.cache/mongodb-binaries`.
9. **La página pública del ticket nunca expone** `notasInternas`, `claveEquipo`, ni el teléfono del
   cliente (`getPublicByToken` los recorta a mano). Hay un test que lo verifica; no lo rompas.
10. **`frontend/.env.e2e` existe para que Playwright no apunte a tu backend de desarrollo.**
    Si cambias el puerto del backend de pruebas, cámbialo en `frontend/.env.e2e` y en
    `e2e/fixtures/env.ts`.
11. **`TRUST_PROXY_HOPS` decide si el throttler ve la IP real.** En producción vale `1` por defecto
    (nginx/Vercel); en test/desarrollo `0`, y eso es deliberado: con `0` se ignora `X-Forwarded-For`,
    así que un test no puede inventarse la IP y saltarse el límite de login. Si un test de throttle
    falla, mira esta variable antes que el límite.
12. **El logout revoca todas las sesiones del usuario, no solo la del navegador.** Sube
    `tokenVersion` a propósito ([ADR 0021](docs/adrs/0021-autenticacion-jwt-en-cookie.md), R-01). Si
    "arreglas" el logout para que solo borre la cookie, rompes
    `e2e/tests/session-revocation.spec.ts` y reabres el riesgo de que una cookie copiada viva 12 h.

## 7. Definición de "terminado"

Un cambio no está terminado hasta que:

1. `backend`: `pnpm exec eslint ...` sin salida, `pnpm build` OK, `pnpm test` y `pnpm test:e2e` en
   verde.
2. `frontend`: `pnpm lint` sin warnings y `pnpm build` OK (incluye el prerender).
3. Si tocaste un flujo de usuario: `cd e2e && pnpm test` en verde.
4. Si cambiaste una decisión de producto, de datos o de seguridad: hay un ADR nuevo o una sección
   "Actualización (fecha)" en el ADR existente — **no reescribas la historia del ADR**.
5. Actualizaste el spec correspondiente en `odd/tasks/` con su sección **Evidencia**.

## 8. Qué no hacer

- No agregues dependencias nuevas sin justificar el peso en el bundle (el sitio es SEO-first).
- No cambies el esquema de la base ni migres datos sin ADR.
- No "arregles" un test cambiando la expectativa. Si el test falla, entendé por qué falla.
- No expongas secretos: `backend/.env` está gitignoreado; nunca imprimas sus valores en un reporte.
- No conviertas `@Public()` en el default. Cada ruta pública es una decisión que debe estar escrita.
