# ArmalyTech backend

NestJS (TypeScript) backend for the ArmalyTech admin panel: authentication, inventory
v2 (brands, phones, categories, products with stock movements) and daily cash closings
("Historial"). See `odd/tasks/inventario-v2.md` for the inventory v2 feature spec and
API contract, and `frontend/adrs/` (0002, 0003, 0004, 0005, 0006, 0008, 0010, 0011,
0020) for the accepted architecture decisions this backend implements — 0006's
"Actualización (2026-09-25)" section is the source of truth for the inventory v2 data
model.

## Architecture

Clean Architecture, screaming structure per feature:

```
src/
  <feature>/
    domain/          entities, value objects, repository port interfaces, domain
                      errors — zero imports from @nestjs, mongoose, or express
    application/      one use-case class per use case, depends only on domain
                      ports (injected via DI tokens, e.g. BRAND_REPOSITORY)
    infrastructure/    Mongoose schemas, repository adapters implementing the
                      ports, Nest controllers + DTOs (the HTTP adapter), and the
                      feature's Nest module wiring tokens -> adapters
  shared/
    domain/           DomainError hierarchy, money rounding helper
    infrastructure/    global exception filter (domain errors -> HTTP status),
                      the @Public() decorator
    config/           env var validation (class-validator)
  app.module.ts, main.ts (local dev), create-nest-app.ts (shared bootstrap)
api/index.ts           Vercel serverless entry, wraps a cached Nest/Express instance
scripts/migrate-sqlite.ts   one-off SQLite -> MongoDB migration (ADR 0008)
test/                   e2e specs (mongodb-memory-server)
```

Dependency rule: `infrastructure -> application -> domain`, never the reverse.
Features: `auth`, `inventory`, `cash-closings`, `health` (health is a passive,
framework-native concern and skips the domain/application layers).

## Environment variables

See `.env.example`. Never commit `.env` (gitignored at the repo root and in
`backend/.gitignore`).

| Var | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string (Atlas in production; local/in-memory for dev — ADR 0003). |
| `PORT` | Local dev HTTP port (`main.ts`). Ignored by the Vercel serverless entry. |
| `NODE_ENV` | `development` \| `production` \| `test`. Controls the `Secure` cookie flag. |
| `JWT_SECRET` | Signs and verifies the session JWT (ADR 0021). Required (or see `SESSION_SECRET` below), at least 32 characters, long and random in production. The app refuses to start without one. |
| `SESSION_SECRET` | **Deprecated** alias for `JWT_SECRET`, kept only for the current deployment (local `.env` and Vercel still set this name). Accepted with the same length requirement, but logs a startup warning telling you to rename it. Set `JWT_SECRET` instead when you next touch the environment. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Used once, at bootstrap, to create the single admin account when the `admins` collection is empty. |
| `SESSION_MAX_AGE_SECONDS` | Session cookie lifetime in seconds (default 12h). |
| `TICKET_SECRET_KEY` | Encrypts/decrypts the ticket device key (`claveEquipo`, AES-256-GCM, ADR 0025). Required, at least 32 characters, long and random in production. Unlike `JWT_SECRET` there is **no fallback**: it never derives from `JWT_SECRET` or a hardcoded value, since that would let anyone reading the source decrypt stored device keys. The app refuses to start without one — add it to your local `.env`. |
| `DNS_SERVERS` | Optional, local dev only. Comma-separated DNS servers (e.g. `8.8.8.8,1.1.1.1`) when the machine resolver refuses SRV lookups (`querySrv ECONNREFUSED` with `mongodb+srv://`). |

## Scripts

```bash
pnpm install
pnpm start:dev        # local dev server on http://localhost:3000/api
pnpm build             # nest build -> dist/
pnpm test              # unit tests (use cases against in-memory fake repositories)
pnpm test:e2e          # e2e tests against mongodb-memory-server
pnpm lint
pnpm migrate:sqlite -- <path-to-sqlite-file> [--dry-run] [--help]
```

## API

All routes are under `/api` (global prefix). See the feature doc's **API contract**
section for the full list (`auth`, `inventory`, `cash-closings`, `health`). Every
route requires the signed session cookie except `GET /api/health`,
`POST /api/auth/login` and a logged-out `POST /api/auth/logout`/`GET /api/auth/me`
(the guard rejects those with `401`, not a redirect).

Errors always come back as:

```json
{ "ok": false, "error": { "statusCode": 409, "message": "...", "code": "conflict", "path": "...", "timestamp": "..." } }
```

## SQLite → MongoDB migration

`scripts/migrate-sqlite.ts` reads the desktop app's SQLite file's `cierre_dia` table
and upserts it into MongoDB idempotently, keyed by natural key (date + row index). It
reuses the same Mongoose schema as the running app. Inventory v2 (brands, phones,
categories, products) is **not** migrated: the old `brands`/`models`/`parts` tables are
test data and inventory v2 starts empty (ADR 0006, "Actualización 2026-09-25").

```bash
pnpm ts-node -r tsconfig-paths/register scripts/migrate-sqlite.ts ./inventory.db --dry-run
pnpm ts-node -r tsconfig-paths/register scripts/migrate-sqlite.ts ./inventory.db
```

`--dry-run` only reads the SQLite file and prints counts; `--help` prints usage.
Requires `MONGODB_URI` in the environment for a real (non-dry-run) run.

## Deploy (Vercel free tier, ADR 0002)

The backend runs as a single Vercel serverless function
(`api/index.ts` + `vercel.json`) wrapping the Nest app via `serverless-http`,
with a cached instance reused across warm invocations (ADR 0003/0010).

The frontend must proxy/rewrite same-origin so the session cookie is sent:

- Vite dev server: proxy `/api/(health|auth|inventory|cash-closings)` to
  `http://localhost:3000`.
- Vercel: a rewrite from `/api/:path*` to the backend function (already the
  default in `vercel.json`, since both frontend and backend share one Vercel
  project — ADR 0002).

Without this, the cookie set by `/api/auth/login` would be cross-origin and the
browser would refuse to send it back on subsequent requests.
