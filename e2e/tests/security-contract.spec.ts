import { test, expect, request } from '@playwright/test';
import { SITE_URL } from '../fixtures/env';

/**
 * Contratos públicos endurecidos (SECURITY.md R-02 / R-06, contrato C4 / C5).
 *
 * These endpoints are reachable without a session, so their *shape* is part of
 * the security surface, not just an implementation detail:
 *
 *  - `POST /api/community/register` must not return the customer document
 *    (phone, consent timestamp, dates) and must not let an anonymous caller
 *    overwrite an existing customer's name.
 *  - `POST /api/tickets/public/lookup` must reject malformed input with 400
 *    instead of blowing up with a 500.
 *
 * They run unauthenticated (`request`, no `storageState`) because that is the
 * threat model: an anonymous caller.
 */

const PHONE = '987111222';
const FIRST_NAME = 'Rosa';

async function register(api: Awaited<ReturnType<typeof request.newContext>>, firstName: string) {
  return api.post('/api/community/register?canal=qr', {
    data: { firstName, lastName: 'Quispe', phone: PHONE, marketingConsent: false },
  });
}

test.describe('Registro público de la comunidad', () => {
  test('no devuelve el documento del cliente ni permite sobrescribir su nombre', async () => {
    const api = await request.newContext({ baseURL: SITE_URL });
    try {
      const first = await register(api, FIRST_NAME);
      expect(first.status()).toBe(201);
      const firstBody = (await first.json()) as {
        ok: boolean;
        data: { client: { firstName: string }; isNewClient: boolean };
      };
      expect(firstBody.data.isNewClient).toBe(true);
      expect(firstBody.data.client.firstName).toBe(FIRST_NAME);

      // An attacker knowing the phone tries to rename an existing customer.
      const second = await register(api, 'Intruso');
      expect(second.status()).toBe(201);
      const secondBody = (await second.json()) as {
        ok: boolean;
        data: { client: { firstName: string }; isNewClient: boolean };
      };
      expect(secondBody.data.isNewClient).toBe(false);
      // The stored name wins: an anonymous caller cannot rewrite it.
      expect(secondBody.data.client.firstName).toBe(FIRST_NAME);

      // Not a single PII field of the customer document may leak.
      const serialized = JSON.stringify(secondBody);
      expect(serialized).not.toContain('phoneE164');
      expect(serialized).not.toContain('consentAt');
      expect(serialized).not.toContain('firstVisitAt');
      expect(serialized).not.toContain('lastVisitAt');
      expect(serialized).not.toContain('visitCount');
      expect(serialized).not.toContain(PHONE);
      expect(serialized).not.toContain('51987111222');
    } finally {
      await api.dispose();
    }
  });
});

test.describe('Búsqueda pública del ticket', () => {
  test('rechaza entrada no-string con 400, no con 500', async () => {
    const api = await request.newContext({ baseURL: SITE_URL });
    try {
      const res = await api.post('/api/tickets/public/lookup', {
        data: { codigo: 123, telefono: 987654321 },
      });
      expect(res.status()).toBe(400);
      const body = (await res.json()) as { ok: boolean };
      expect(body.ok).toBe(false);
    } finally {
      await api.dispose();
    }
  });

  test('sigue exigiendo los dos datos', async () => {
    const api = await request.newContext({ baseURL: SITE_URL });
    try {
      const sinTelefono = await api.post('/api/tickets/public/lookup', {
        data: { codigo: 'AT-000001' },
      });
      expect(sinTelefono.status()).toBe(400);

      const vacio = await api.post('/api/tickets/public/lookup', { data: {} });
      expect(vacio.status()).toBe(400);
    } finally {
      await api.dispose();
    }
  });
});
