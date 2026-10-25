# Registro de revisiones de código

Este repo se revisa con un protocolo explícito, y cada revisión deja rastro aquí. La razón es
simple: en un proyecto asistido por agentes, "quedó bien" sin evidencia es una opinión, no un hecho.

## El protocolo

Cada revisión sigue los mismos cinco pasos, y el registro dice qué se hizo de verdad en cada uno:

1. **Leer el diff completo**, no el resumen del agente que lo escribió.
2. **Correr los checks** (los mismos que corre CI): `pnpm exec eslint` sin `--fix`, `pnpm build`,
   `pnpm test`, `pnpm test:e2e` en backend; `pnpm lint` y `pnpm build` en frontend; `pnpm test` en
   `e2e/`.
3. **Pase adversarial**: buscar activamente lo que *no* se probó — caminos de error, estados de
   carga, permisos, qué pasa con datos vacíos, qué pasa si el usuario recarga en medio del flujo.
4. **Verificar la cadena documental**: ¿la decisión está en un ADR? ¿el spec tiene su sección
   Evidencia? ¿el PRD sigue siendo cierto después del cambio?
5. **Anotar hallazgos aquí**, incluso los que no se arreglan en ese momento (con estado y dueño).

Severidad:

- **C1 — crítico**: rompe el producto, filtra datos o impide operar. Se arregla antes de seguir.
- **C2 — alto**: comportamiento incorrecto visible para el usuario o riesgo operativo.
- **C3 — medio**: inconsistencia, deuda que va a doler, accesibilidad, UX.
- **C4 — menor**: cosmético o de mantenimiento.

---

## R-2026-09-26 · QA manual del panel completo

**Alcance:** panel administrativo entero, con backend local y datos de prueba (ticket `AT-000001`).
**Método:** recorrido manual en navegador, caso por caso, anotando lo que falla sin corregirlo en el
momento. **Resultado:** 18 hallazgos (4 C1, 6 C2, 8 C3) y una lista explícita de lo que no se pudo
verificar.

El detalle completo, con el caso reproducible de cada hallazgo, está en
[odd/tasks/qa-2026-09-26.md](../odd/tasks/qa-2026-09-26.md). Los cuatro críticos:

| # | Hallazgo | Estado |
|---|---|---|
| 1 | `/api/technicians`, `/api/cobros` y `/api/sales` no estaban en las listas de prefijos proxeados → devolvían el HTML del SPA | Cerrado |
| 2 | La bandeja de tickets leía `data.items` mientras el backend devolvía `{ tickets, … }` → "Aún no hay tickets" con tickets existentes | Cerrado |
| 3 | El cliente nuevo de un ticket no se creaba en Clientes → el ticket quedaba sin `clienteId` y no sumaba sello | Cerrado |
| 4 | `GET /api/tickets` no usaba el envelope `{ ok, data }` y devolvía `claveEquipo` (cifrada) en el listado | Cerrado |

Los cierres están registrados en la sección **"Fase de corrección y cierre"** de
[odd/tasks/modulo-tickets.md](../odd/tasks/modulo-tickets.md#L51-L82), tarea por tarea, con la
evidencia de cada una.

**Lo que esta revisión dejó abierto y sigue abierto:** los ítems "No verificado" del QA (cobros
creados, anular cobro, aprobar sin stock, quitar pieza, vista celular en dispositivo real). Hoy los
tres primeros están cubiertos por tests; el último sigue siendo deuda.

---

## R-2026-10-25 · Cierre de deuda documental y de testing

**Alcance:** todo el repo, contra la rúbrica del proyecto integrador. **Método:** auditoría de
archivos + lectura de los documentos existentes + verificación en producción + corrida completa de
las tres suites.

**Qué se encontró y qué se hizo en esta revisión:**

| # | Severidad | Hallazgo | Acción |
|---|---|---|---|
| 1 | C1 | No existía **ningún** test de Playwright, aunque el QA decía "E2E validado con Playwright" (se había usado a mano, sin dejar archivo) | Se creó `e2e/` con 10 tests, backend desechable y CI. Ver [e2e/README.md](../e2e/README.md) |
| 2 | C1 | No existía CI/CD: `.github/workflows/` nunca estuvo en la historia del repo | Se agregó [ci.yml](../.github/workflows/ci.yml): lint, build, unit, e2e de Jest y Playwright |
| 3 | C2 | `TECH-DESIGN.md` solo listaba los ADR 0001–0024; los ADR 0025–0029 existían pero no estaban referenciados desde ningún documento de arquitectura | Se agregaron las cinco filas a la tabla de decisiones |
| 4 | C2 | Toda la documentación vivía dentro de `frontend/` (`PRD.md`, `TECH-DESIGN.md`, `adrs/`), invisible desde la raíz del repo | Se movieron a `PRD.md`, `TECH-DESIGN.md` y `docs/adrs/`, con los enlaces de todos los documentos actualizados |
| 5 | C2 | Faltaban `DESIGN.md`, `BACKLOG.md`, `SECURITY.md`, `DEPLOY.md`, `README.md` y `CLAUDE.md` en la raíz | Creados en esta revisión |
| 6 | C3 | El mensaje de error del login es **"Invalid username or password"** en inglés, en un panel que está en español | **Abierto** — `backend/src/auth/domain/auth.errors.ts:8`. El test de E2E acepta ambos idiomas para no bloquear el arreglo |
| 7 | C3 | Mongoose avisa en cada arranque: índice duplicado en `{"categoryId":1}` (declarado con `index: true` **y** con `schema.index()`) | **Abierto** — ruido en logs, sin impacto funcional |
| 8 | C4 | `frontend/` tiene dos configuraciones de ESLint (`.eslintrc.cjs` y `eslint.config.js`). Con ESLint 9 la flat config gana y la otra es un archivo muerto | **Abierto** — borrarlo sin verificar antes que nadie lo importe |
| 9 | C3 | Las aserciones de la suite nueva usaban `getByRole('heading', { name })` sin `exact: true`, que hace matching por **substring**: un cambio de copy en el producto no hacía fallar el test | **Cerrado** — se agregó `exact: true` a los headings y se validó con el mutation check de abajo |
| 10 | C2 | La página pública le decía al cliente **"esta página se actualiza sola"** y no había ningún refresco: `src/ticket/` no tenía polling, `useQuery` ni SSE | **Cerrado** — polling cada 30 s + refresco en `visibilitychange` en [TicketPage.jsx](../frontend/src/ticket/TicketPage.jsx), con recargas silenciosas que conservan el último estado válido. Test nuevo: `el cliente ve el cambio de estado sin recargar la página` |
| 11 | C2 | `TECH-DESIGN.md` seguía marcando como **PENDIENTE** cosas ya implementadas (lookup por código+teléfono, atomicidad del stock, migración SQLite) y su tabla de decisiones se detenía en el ADR 0024 | **Cerrado** — criterios actualizados con su estado real y ADR 0025–0029 agregados a la tabla |
| 12 | C2 | El criterio de aceptación `warning.stock_zero` **nunca se implementó**; el producto resolvió distinto (409 `insufficient_stock` con faltantes) | **Cerrado como documentación** — el contrato real quedó escrito en `TECH-DESIGN.md`. No es un bug: la decisión final está en ADR 0025 |
| 13 | C3 | El ticket público no exponía `notaCliente` aunque el formulario lo captura; el contrato de `ticketApi.js` no lo documentaba | **Abierto** — requiere decidir si la nota es visible para el cliente antes de exponerla |

**Checks corridos en esta revisión (todos en verde):**

| Comando | Resultado |
|---|---|
| `backend: pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` | 0 errores, 0 warnings |
| `backend: pnpm build` | OK |
| `backend: pnpm test` | 28 suites · 226 tests |
| `backend: pnpm test:e2e` | 9 suites · 74 tests |
| `frontend: pnpm lint` | 0 warnings |
| `frontend: pnpm build` | OK · 13 rutas prerenderizadas |
| `e2e: pnpm test` | 10 tests |

**Verificación en producción:** `https://www.armalytech.com` responde 200 y `/api/health` devuelve
`db.state = connected`.

### Mutation check: ¿la suite detecta un producto roto?

Una suite en verde no prueba nada por sí sola; hay que demostrar que se pone roja cuando el producto
se rompe. Se hizo así:

1. Se alteró el copy del hero de `pendiente` en `frontend/src/ticket/lib/ticketPresenter.js`.
2. Se corrió solo el test del flujo crítico → **pasó igual**. Ese fue el hallazgo #9: las
   aserciones eran por substring.
3. Se endurecieron los headings con `exact: true` y se repitió → **falló**, como debía
   (`getByRole('heading', { name: 'Recibimos tu equipo.', exact: true })`).
4. Se revirtió el archivo y se confirmó con `git diff` que quedó idéntico.

Conclusión: los 10 tests miden comportamiento real del producto, no la presencia de un texto
aproximado.

---

## R-2026-10-25b · Pase de endurecimiento de seguridad y corrección de dirección

**Alcance:** los riesgos R-01…R-09 de [SECURITY.md](../SECURITY.md) y la dirección del local.
**Método:** contrato escrito antes de tocar código ([seguridad-hardening-2026-10-25.md](../odd/tasks/seguridad-hardening-2026-10-25.md)),
dos escritores en carpetas disjuntas (backend / frontend), revisión de los diffs por el orquestador y
verificación de cierre con las tres suites.

| # | Severidad | Hallazgo | Acción |
|---|---|---|---|
| 1 | C1 | El logout **no revocaba** el token: una cookie copiada seguía sirviendo hasta 12 h | Cerrado — `LogoutUseCase` sube `tokenVersion`; la ruta es pública e idempotente. Test E2E que **replaya** la cookie vieja y exige 401 |
| 2 | C1 | El registro público devolvía el documento completo del cliente y **sobrescribía su nombre** | Cerrado — proyección `{ firstName, stamps }` y el re-registro no reescribe nombres |
| 3 | C2 | `/api/contact` era un relay abierto: CORS reflejado con credenciales y sin límite | Cerrado — allowlist de orígenes, sin `Allow-Credentials`, 5/10 min por IP, topes de longitud |
| 4 | C2 | El throttle no veía la IP real (`trust proxy` sin configurar) | Cerrado — `TRUST_PROXY_HOPS` con default 1 en producción y test que distingue ambos casos |
| 5 | C2 | El lookup público devolvía **500** con entrada no-string; el endpoint de notas no validaba nada | Cerrado — `LookupPublicTicketDto` y `AddTicketNoteDto` |
| 6 | C3 | La dirección del local estaba mal en **24 lugares** y en dos números distintos (1859 y 1873) | Cerrado — **Av. San Luis 1849-1851** en textos, `ADDRESS`, JSON-LD, metas y comprobante |
| 7 | C3 | Sin cabeceras de seguridad en ningún camino de despliegue | Cerrado parcial — cinco cabeceras en nginx y Vercel, `x-powered-by` deshabilitado; **CSP sigue pendiente** |
| 8 | C4 | `backend/.env.example` no documentaba `JWT_SECRET` ni `TICKET_SECRET_KEY` | Cerrado — completo, con las longitudes mínimas y el alias deprecado marcado |
| 9 | C3 | `mustChangePassword` se aplica solo en el cliente | **Abierto** — decisión consciente: exige su propio diseño para no encerrar al usuario |

**Checks corridos al cierre (sobre el árbol terminado):**

| Comando | Resultado |
|---|---|
| `backend: pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` | 0 errores, 0 warnings |
| `backend: pnpm build` | OK |
| `backend: pnpm test` | 29 suites · **230** tests |
| `backend: pnpm test:e2e` | 10 suites · **88** tests |
| `backend: pnpm test:e2e -- security` | 1 suite · **33** tests |
| `frontend: pnpm lint` | 0 warnings |
| `frontend: pnpm build` | OK · 13 rutas prerenderizadas |
| `e2e: pnpm test` | **16** tests |

**Verificación independiente del orquestador (no se aceptó el reporte tal cual):**
- La dirección se comprobó en el **HTML prerenderizado**: 20 apariciones de `1849-1851`, **0** de las
  anteriores. Los cuatro restos de `1859` en `frontend/src` son coordenadas de `google.com/maps/embed`
  (`1d289.9719361859796`), no la dirección; tocarlas habría roto el mapa.
- Los diffs de `contact.js`, `vercel.ts`, `nginx`, `logout.use-case.ts`, `trust-proxy.ts`,
  `community.controller.ts` y `auth.controller.ts` se leyeron línea por línea.

**Lo que este pase deliberadamente NO hizo:** CSP estricta (necesita nonces y QA visual por el JSON-LD
inline, el iframe de Maps y el widget de WhatsApp), `mustChangePassword` en el servidor (riesgo de
encerrar al usuario), y los `@MaxLength` de `CreateTicketDto` (inalcanzables: `body-parser` corta en
100 kB). Las tres quedan escritas como deuda, no como hechas.

## Revisión de seguridad

La revisión de seguridad es un entregable aparte y vive en [SECURITY.md](../SECURITY.md): 9 áreas de
control, la suite de ataques ejecutada (9 `describe`, 30 tests) y nueve riesgos residuales
**R-01…R-09**, cada uno con impacto, probabilidad y recomendación. Este registro no los repite; si una
revisión de código cambia el estado de uno de esos riesgos, se actualiza allá y se referencia aquí.

## Cómo agregar una revisión

Copia el encabezado `## R-AAAA-MM-DD · título`, deja la tabla de hallazgos con severidad, acción y
estado, y anota los checks corridos con su resultado real. Si cierras un hallazgo anterior, no lo
borres: cambia su estado a Cerrado y enlaza el commit o el archivo donde se arregló.
