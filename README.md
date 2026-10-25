# ArmalyTech Website

Sitio público de un taller de reparación de celulares en Lima (Perú) y, encima de él, la herramienta
con la que el taller opera: **panel de tickets, inventario, cierre de caja y clientes**, más una
**página pública de seguimiento** donde el cliente ve el estado de su equipo sin crear cuenta.

**En producción:** <https://www.armalytech.com> · **Salud:** [`/api/health`](https://www.armalytech.com/api/health)

[![CI](https://github.com/BigNight1/Armalytech-Website/actions/workflows/ci.yml/badge.svg)](https://github.com/BigNight1/Armalytech-Website/actions/workflows/ci.yml)

---

## El problema que resuelve

El seguimiento de una reparación dependía de WhatsApp y llamadas: el cliente no tenía forma de saber
en qué iba su equipo sin preguntar, y el técnico respondía la misma pregunta todo el día. Además el
inventario vivía aislado en una aplicación de escritorio con SQLite, accesible solo desde esa PC
([PRD.md](PRD.md), problema).

La versión actual convierte la vitrina estática en una herramienta operativa: cada ticket genera un
enlace opaco que el cliente consulta con su código y su celular, y el taller gestiona tickets,
repuestos, cobros y clientes desde cualquier lugar.

## Stack

| Capa | Tecnología | Decisión |
|---|---|---|
| Sitio + panel | React 18, Vite, Tailwind, React Query | [ADR 0001](docs/adrs/0001-stack-frontend-react-vite.md) · [ADR 0009](docs/adrs/0009-manejo-de-estado-en-el-frontend.md) |
| API | NestJS 10, TypeScript, Clean Architecture por feature | [ADR 0011](docs/adrs/0011-backend-nestjs.md) · [ADR 0020](docs/adrs/0020-arquitectura-limpia-por-feature.md) |
| Datos | MongoDB Atlas + Mongoose | [ADR 0003](docs/adrs/0003-base-de-datos-mongodb-atlas.md) |
| Sesión | JWT en cookie `httpOnly`, roles `owner`/`admin` | [ADR 0021](docs/adrs/0021-autenticacion-jwt-en-cookie.md) · [ADR 0022](docs/adrs/0022-usuarios-y-roles-fijos.md) |
| Tiempo real | SSE + invalidación de React Query | [ADR 0028](docs/adrs/0028-tiempo-real-sse-invalidacion.md) |
| WhatsApp | Kapso (plantillas) + n8n (automatizaciones) | [ADR 0029](docs/adrs/0029-plantillas-whatsapp-via-kapso.md) · [ADR 0026](docs/adrs/0026-bot-whatsapp-ventana-24h-y-resena.md) |
| Tests | Jest + supertest + mongodb-memory-server · Playwright | [SECURITY.md](SECURITY.md) para la suite de seguridad |

## Arranque rápido

Requisitos: Node 22, pnpm 11.

```bash
# API
cd backend
pnpm install
cp .env.example .env          # completar MONGODB_URI, JWT_SECRET y TICKET_SECRET_KEY (≥32 chars)
pnpm start:dev                # http://localhost:3000/api

# Web (otra terminal)
cd frontend
pnpm install
pnpm dev                      # http://localhost:5173  ·  panel en /admin
```

El panel se crea solo la primera vez: al arrancar, el backend siembra la cuenta `owner` con
`ADMIN_USERNAME` / `ADMIN_PASSWORD`. Después de eso, esas variables ya no se usan.

## Estructura

```
.
├── frontend/          SPA: sitio público, panel /admin, ticket público, registro QR
│   └── scripts/prerender.mjs       prerender de 13 rutas (SEO)
├── backend/           API NestJS bajo /api (auth, inventory, cash-closings,
│                      community, tickets, cobros, sales, staff, whatsapp)
│   ├── test/          e2e de Jest + el arranque del backend desechable para Playwright
│   └── scripts/migrate-sqlite.ts   migración one-off desde la app de escritorio
├── e2e/               suite Playwright (flujo público del ticket + flujo del panel)
├── docs/adrs/         29 ADRs (MADR)
├── odd/tasks/         specs de feature con contrato de API y evidencia por tarea
├── design/            briefs y prototipos HTML de referencia
├── reports/ · research_notes/   investigación de competencia y SEO
└── .github/workflows/ci.yml     CI: lint · build · unit · e2e · Playwright
```

## Pipeline documental

Cada documento responde al anterior. Esa cadena es el punto: un cambio de alcance entra por el PRD y
baja hasta el código, no al revés.

| Documento | Responde | Responde a |
|---|---|---|
| [PRD.md](PRD.md) | ¿Qué problema, para quién, con qué alcance y qué queda fuera? | La necesidad del negocio |
| [DESIGN.md](DESIGN.md) | ¿Cómo se ve y se siente? ¿Qué sistema visual, componentes y estados? | El PRD |
| [TECH-DESIGN.md](TECH-DESIGN.md) | ¿Cómo se construye? Modelo de datos, componentes, criterios de aceptación. | El PRD + el diseño |
| [docs/adrs/](docs/adrs/) | ¿Por qué así y no de otra forma? Una decisión por archivo. | El Tech Design |
| [odd/tasks/](odd/tasks/) | ¿En qué se descompone y qué contrato de API tiene? | Los ADRs |
| [BACKLOG.md](BACKLOG.md) | ¿Qué está hecho, qué falta y con qué evidencia? | Los specs + el repo |
| [docs/REVIEWS.md](docs/REVIEWS.md) | ¿Qué encontró cada revisión de código y qué se cerró? | El código |
| [SECURITY.md](SECURITY.md) | ¿Qué se probó contra ataques y qué queda expuesto? | El código |
| [DEPLOY.md](DEPLOY.md) | ¿Cómo se publica y cómo se verifica? | Todo lo anterior |
| [CLAUDE.md](CLAUDE.md) | ¿Cómo se trabaja en este repo? Reglas, comandos y trampas. | — |

## Tests

Tres capas, cada una con su responsabilidad:

| Capa | Qué prueba | Cómo se corre | Estado |
|---|---|---|---|
| Unitarias | Casos de uso contra repositorios fake en memoria | `cd backend && pnpm test` | 29 suites · 230 tests |
| E2E de API | HTTP real con supertest contra Mongo en memoria | `cd backend && pnpm test:e2e` | 10 suites · 88 tests |
| E2E de navegador | Un navegador real: el cliente consulta su ticket y el admin mueve el taller | `cd e2e && pnpm test` | 16 tests |

La suite de Playwright arranca **su propio** backend (`backend/test/start-e2e-server.ts`, Mongo en
memoria, sin tocar Atlas ni Kapso) y su propio Vite (`--mode e2e`), así que no necesitas nada
levantado para correrla. El flujo que cubre es el del PRD: el admin aprueba y avanza una reparación,
y el cliente lo ve en su enlace.

## Despliegue

Ver [DEPLOY.md](DEPLOY.md). Resumen: dos contenedores (nginx para el frontend, Node para el backend)
sobre MongoDB Atlas, con el CI corriendo en cada push pero el despliegue como acción explícita.

## Convenciones

Antes de tocar código, lee [CLAUDE.md](CLAUDE.md): reglas de git, arquitectura por capas, los tres
lugares donde vive la lista de prefijos `/api/*`, y las trampas que ya costaron un bug.
