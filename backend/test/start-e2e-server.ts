/**
 * Boots a disposable backend for the Playwright E2E suite (`e2e/`).
 *
 * Why this exists: the E2E suite must exercise the real HTTP surface
 * (`/api/auth/login`, `/api/tickets`, `/api/tickets/public/lookup`, …) against
 * the real Nest app, but it must never touch the developer's `.env` or the
 * Atlas database. This entry point:
 *
 *   1. starts `mongodb-memory-server` (same in-memory Mongo the Jest e2e specs
 *      use — ADR 0003),
 *   2. sets every required env var *before* importing the app, so
 *      `ConfigModule.forRoot({ ignoreEnvFile: NODE_ENV === 'test' })` skips
 *      `backend/.env` entirely (no Atlas URI, no Kapso/WhatsApp credentials,
 *      no n8n webhooks),
 *   3. listens on a dedicated port (`E2E_BACKEND_PORT`, default 3100) so it can
 *      never collide with a real `pnpm start:dev` on 3001,
 *   4. shuts the Mongo instance down on SIGINT/SIGTERM so Playwright's
 *      `webServer` teardown leaves no orphaned `mongod` process.
 *
 * Run from `backend/`:
 *   pnpm ts-node -r tsconfig-paths/register test/start-e2e-server.ts
 */
import 'reflect-metadata';
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = Number(process.env.E2E_BACKEND_PORT ?? 3100);
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-owner@armalytech.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-owner-password';

async function main(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Must be set before `../src/create-nest-app` is imported: `AppModule`
  // reads NODE_ENV at module-decorator evaluation time to decide whether to
  // load `backend/.env`.
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = uri;
  process.env.PORT = String(PORT);
  process.env.JWT_SECRET = 'e2e-jwt-secret-armalytech-not-a-real-secret-32';
  process.env.TICKET_SECRET_KEY = 'e2e-ticket-key-armalytech-not-real-32chars';
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.ADMIN_USERNAME = ADMIN_EMAIL;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.SESSION_MAX_AGE_SECONDS = '43200';
  // Belt and braces: never inherit the deprecated alias or any integration
  // credential from the shell that launched Playwright.
  delete process.env.SESSION_SECRET;
  delete process.env.KAPSO_API_KEY;
  delete process.env.KAPSO_PHONE_NUMBER_ID;
  delete process.env.KAPSO_WEBHOOK_SECRET;
  delete process.env.N8N_WEBHOOK_URL;
  delete process.env.DNS_SERVERS;

  // Dynamic import so the env above is in place before the module graph loads.
  const { createNestApp } = await import('../src/create-nest-app');
  const app = await createNestApp();
  await app.listen(PORT);

  // eslint-disable-next-line no-console
  console.log(`[e2e] backend ready on http://127.0.0.1:${PORT}/api`);
  // eslint-disable-next-line no-console
  console.log(`[e2e] admin ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`[e2e] mongo ${uri}`);

  let closing = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    // eslint-disable-next-line no-console
    console.log(`[e2e] shutting down (${signal})`);
    try {
      await app.close();
    } finally {
      await mongod.stop();
    }
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[e2e] failed to boot the test backend', error);
  process.exit(1);
});
