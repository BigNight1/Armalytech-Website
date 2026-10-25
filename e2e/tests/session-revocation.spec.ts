import { test, expect, request } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, SITE_URL } from '../fixtures/env';

/**
 * Session revocation (SECURITY.md R-01, contrato C1).
 *
 * The panel's session is a stateless JWT in an httpOnly cookie. Clearing the
 * cookie in the browser is not enough: a copied token used to stay valid until
 * its `exp` (12 h). `POST /api/auth/logout` must invalidate it server-side by
 * bumping the user's `tokenVersion`, which the session guard already compares.
 *
 * This spec keeps the *original* cookie string and replays it after logging out,
 * so it fails if logout only clears the cookie instead of revoking the token.
 * It uses its own request contexts (never the shared `storageState`) so it
 * cannot disturb the other specs' session.
 */
test.describe('Revocación de sesión', () => {
  test('el token deja de servir después de cerrar sesión', async () => {
    const api = await request.newContext({ baseURL: SITE_URL });
    try {
      const login = await api.post('/api/auth/login', {
        data: { email: ADMIN_EMAIL, username: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      expect(login.ok()).toBeTruthy();

      const setCookie = login.headers()['set-cookie'] ?? '';
      // Keep the raw `name=value` pair: this is what an attacker with a stolen
      // cookie would replay.
      const stolenCookie = setCookie.split(';')[0];
      expect(stolenCookie).toMatch(/=./);

      // The token works before logging out.
      const before = await api.get('/api/auth/me', { headers: { cookie: stolenCookie } });
      expect(before.status()).toBe(200);

      const logout = await api.post('/api/auth/logout');
      expect(logout.status()).toBe(200);

      // Replay the SAME cookie from a clean context (no cookie store).
      const replay = await request.newContext({ baseURL: SITE_URL });
      try {
        const after = await replay.get('/api/auth/me', { headers: { cookie: stolenCookie } });
        expect(after.status()).toBe(401);
      } finally {
        await replay.dispose();
      }
    } finally {
      await api.dispose();
    }
  });

  test('cerrar sesión sin cookie es idempotente y no filtra si había sesión', async () => {
    const anonymous = await request.newContext({ baseURL: SITE_URL });
    try {
      const res = await anonymous.post('/api/auth/logout');
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    } finally {
      await anonymous.dispose();
    }
  });
});
