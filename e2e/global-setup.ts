import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { request } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_STATE_PATH, SITE_URL } from './fixtures/env';

/**
 * Signs in once for the whole run and saves the session cookie to
 * `AUTH_STATE_PATH`.
 *
 * `POST /api/auth/login` is throttled at 5 requests/minute per IP (a real
 * defence, not a test artifact). Doing the login here — instead of in every
 * spec's `beforeAll` — keeps a full run at 3 requests total: this one, the
 * positive form-login test and the wrong-credentials test.
 */
export default async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL: SITE_URL });
  try {
    const res = await api.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, username: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    if (!res.ok()) {
      throw new Error(
        `Global setup: no se pudo iniciar sesión como ${ADMIN_EMAIL} ` +
          `(HTTP ${res.status()}): ${await res.text()}`,
      );
    }

    mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });
    await api.storageState({ path: AUTH_STATE_PATH });
  } finally {
    await api.dispose();
  }
}
