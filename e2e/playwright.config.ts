import { defineConfig, devices } from '@playwright/test';
import { BACKEND_PORT, FRONTEND_PORT } from './fixtures/env';

const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/api/health`;

/**
 * E2E suite for the ArmalyTech site + admin panel.
 *
 * Two `webServer` entries are booted for every run:
 *
 *  - `backend/` on `BACKEND_PORT`: the real Nest app against an in-memory
 *    Mongo (`backend/test/start-e2e-server.ts`). `NODE_ENV=test` makes
 *    `AppModule` ignore `backend/.env`, so Atlas, Kapso/WhatsApp and n8n are
 *    never touched.
 *  - `frontend/` on `FRONTEND_PORT`: `vite --mode e2e`, so `frontend/.env.e2e`
 *    wins over `frontend/.env` and the `/api/*` proxy targets the disposable
 *    backend instead of a local `start:dev` on 3001.
 *
 * `workers: 1` is deliberate: the specs share one database, and the login
 * endpoint is throttled at 5 requests/minute (`@Throttle` on
 * `POST /api/auth/login`), so parallel workers would trip it.
 */
export default defineConfig({
  testDir: './tests',
  // Signs in once and stores the session cookie, so the login throttle
  // (5 req/min) stays a real defence instead of a per-test obstacle.
  globalSetup: './global-setup',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm ts-node -r tsconfig-paths/register test/start-e2e-server.ts',
      cwd: '../backend',
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `pnpm exec vite --mode e2e --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      cwd: '../frontend',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      // Belt and braces alongside `frontend/.env.e2e`: make sure the proxy
      // can never fall back to a developer's local backend on 3001.
      env: { BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}` },
    },
  ],
});
