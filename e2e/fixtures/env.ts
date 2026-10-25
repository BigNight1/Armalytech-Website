import { join } from 'node:path';

/**
 * Single source of truth for the ports/credentials the E2E suite runs against.
 *
 * Nothing here points at production: the backend is a disposable Nest app on
 * an in-memory Mongo (`backend/test/start-e2e-server.ts`) and the frontend is a
 * `vite --mode e2e` dev server whose proxy targets that backend (see
 * `frontend/.env.e2e`).
 */
export const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 5273);
export const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3100);

/** Keys the backend bootstraps the owner account with (kept in sync with start-e2e-server.ts). */
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-owner@armalytech.test';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-owner-password';

export const SITE_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
export const API_URL = `http://127.0.0.1:${BACKEND_PORT}/api`;

/**
 * Session cookie captured once by `global-setup.ts` and reused by the specs,
 * so the login throttle is not part of the measure of every test.
 */
export const AUTH_STATE_PATH = join(__dirname, '..', '.auth', 'owner.json');
