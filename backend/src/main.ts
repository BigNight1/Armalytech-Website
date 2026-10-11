import 'reflect-metadata';
import { createNestApp } from './create-nest-app';
import { applyDnsServersOverride } from './shared/config/dns';

/**
 * Long-running entry point: local dev (`pnpm start:dev`) and the Dokploy
 * container (`node dist/src/main.js`). Vercel uses `api/index.ts` instead,
 * which never calls `listen()` (ADR 0002 / ADR 0011). Both share
 * `createNestApp()` so options such as `rawBody` (Kapso webhook signatures,
 * ADR 0029) cannot drift between runtimes.
 */
async function bootstrap() {
  applyDnsServersOverride();
  const app = await createNestApp();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ArmalyTech backend listening on http://localhost:${port}/api`);
}

bootstrap();
