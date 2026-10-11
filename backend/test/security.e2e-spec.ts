import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

/**
 * Authorized security testing of this app's own code, exercised only
 * against the in-memory test app (mongodb-memory-server). Never run these
 * payloads against a live server or external host.
 *
 * Each `describe` block boots its own app instance so the login throttler
 * (`@Throttle({ limit: 5, ttl: 60_000 })` on POST /api/auth/login) and any
 * mutations (password changes, created records) never leak between
 * unrelated assertions.
 */

const JWT_SECRET = 'security-e2e-test-secret-minimum-32-characters!';

function base64url(input: Record<string, unknown> | string): string {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  return Buffer.from(raw).toString('base64url');
}

/** Crafts a syntactically valid but entirely unsigned `alg: none` JWT. */
function buildAlgNoneToken(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };
  return `${base64url(header)}.${base64url(payload)}.`;
}

/** Decodes a token's payload, mutates it, and reassembles it with the
 * ORIGINAL (now-mismatching) signature, simulating an attacker editing a
 * claim without knowing the signing secret. */
function tamperPayload(
  token: string,
  mutate: (payload: Record<string, unknown>) => void,
): string {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const payload = JSON.parse(
    Buffer.from(payloadB64, 'base64url').toString('utf8'),
  ) as Record<string, unknown>;
  mutate(payload);
  return `${headerB64}.${base64url(payload)}.${signatureB64}`;
}

function setCookieHeader(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  expect(value).toBeDefined();
  return value as string;
}

describe('Security (e2e)', () => {
  describe('NoSQL injection on login', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    const adminEmail = 'nosql-admin@armalytech.com';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: 'Sup3r-Secret-Password!',
      }));
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it.each([
      { email: { $ne: null }, password: { $ne: null } },
      { email: { $gt: '' }, password: { $gt: '' } },
      { email: adminEmail, password: { $ne: 'x' } },
    ])('rejects operator payload %#: %j', async (body) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(body);

      expect([400, 401]).toContain(res.status);
      expect(res.status).not.toBe(200);
      expect(res.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('SQL-style string injection on login', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    const adminEmail = 'sqlstyle-admin@armalytech.com';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: 'Sup3r-Secret-Password!',
      }));
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it.each([
      { email: "' OR 1=1 --", password: 'whatever' },
      { email: "admin' --", password: 'whatever' },
      { email: adminEmail, password: "' OR '1'='1" },
    ])('rejects SQL-style payload %#: %j', async (body) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(body);

      expect([400, 401]).toContain(res.status);
      expect(res.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('Query-string operator injection and regex safety (authenticated)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let cookie: string;
    const adminEmail = 'query-admin@armalytech.com';
    const adminPassword = 'Sup3r-Secret-Password!';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: adminPassword,
      }));

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      expect(loginRes.status).toBe(200);
      cookie = setCookieHeader(loginRes);
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it('rejects a Mongo operator nested under categoryId on /inventory/products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/products?categoryId[$ne]=x')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('rejects a Mongo operator nested under q on /inventory/products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/products?q[$regex]=.*')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('rejects a Mongo operator nested under consent on /community/clients', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/community/clients?consent[$ne]=approved')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('treats a ReDoS-shaped q as a literal, escaped search term and answers fast', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get('/api/inventory/products')
        .query({ q: '(a+)+$' })
        .set('Cookie', cookie);
      const elapsedMs = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(elapsedMs).toBeLessThan(2000);
    });

    it('treats a wildcard-shaped q as a literal, escaped search term and answers fast', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get('/api/inventory/products')
        .query({ q: '.*' })
        .set('Cookie', cookie);
      const elapsedMs = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(elapsedMs).toBeLessThan(2000);
    });
  });

  describe('JWT tampering', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let validToken: string;
    let realUserId: string;
    const adminEmail = 'jwt-admin@armalytech.com';
    const adminPassword = 'Sup3r-Secret-Password!';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: adminPassword,
      }));

      // Single real login: gives us a genuinely valid, correctly signed
      // token and the real user id to build every tampered variant from,
      // without spending further attempts against the login throttler.
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      expect(loginRes.status).toBe(200);
      realUserId = loginRes.body.data.id;
      const cookie = setCookieHeader(loginRes);
      validToken = cookie.split(';')[0].split('=').slice(1).join('=');
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    async function requestWithToken(token: string) {
      return request(app.getHttpServer())
        .get('/api/inventory/brands')
        .set('Cookie', `armalytech_session=${token}`);
    }

    it('accepts the genuinely valid token as a control', async () => {
      const res = await requestWithToken(validToken);
      expect(res.status).toBe(200);
    });

    it('rejects a token signed with a different secret', async () => {
      const jwtService = new JwtService({});
      const forged = jwtService.sign(
        {
          sub: realUserId,
          email: adminEmail,
          username: adminEmail,
          role: 'owner',
          tokenVersion: 0,
        },
        {
          secret: 'a-completely-different-secret-at-least-32-chars',
          expiresIn: '1h',
        },
      );

      const res = await requestWithToken(forged);
      expect(res.status).toBe(401);
    });

    it('rejects an alg:none token', async () => {
      const forged = buildAlgNoneToken({
        sub: realUserId,
        email: adminEmail,
        username: adminEmail,
        role: 'owner',
        tokenVersion: 0,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const res = await requestWithToken(forged);
      expect(res.status).toBe(401);
    });

    it('rejects a token whose payload was edited (role escalation) without re-signing', async () => {
      const tampered = tamperPayload(validToken, (payload) => {
        payload.role = 'owner-with-extra-privileges';
      });

      const res = await requestWithToken(tampered);
      expect(res.status).toBe(401);
    });

    it('rejects an expired token', async () => {
      const jwtService = new JwtService({});
      const expired = jwtService.sign(
        {
          sub: realUserId,
          email: adminEmail,
          username: adminEmail,
          role: 'owner',
          tokenVersion: 0,
        },
        { secret: JWT_SECRET, expiresIn: -3600 },
      );

      const res = await requestWithToken(expired);
      expect(res.status).toBe(401);
    });

    it('rejects a valid-signature token whose tokenVersion is now stale after a password change', async () => {
      const agent = request.agent(app.getHttpServer());
      const loginRes = await agent
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      expect(loginRes.status).toBe(200);
      const staleCookie = setCookieHeader(loginRes);
      const staleToken = staleCookie
        .split(';')[0]
        .split('=')
        .slice(1)
        .join('=');

      const changeRes = await agent.patch('/api/account/password').send({
        currentPassword: adminPassword,
        newPassword: 'Br4nd-N3w-Password!',
      });
      expect(changeRes.status).toBe(200);

      const res = await requestWithToken(staleToken);
      expect(res.status).toBe(401);
    });
  });

  describe('Mass assignment', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let cookie: string;
    const adminEmail = 'mass-admin@armalytech.com';
    const adminPassword = 'Sup3r-Secret-Password!';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: adminPassword,
      }));

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      expect(loginRes.status).toBe(200);
      cookie = setCookieHeader(loginRes);
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it('strips unknown/privileged fields from the login body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          role: 'super-owner',
          isAdmin: true,
          tokenVersion: 999,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('owner');
    });

    it('ignores a privileged role/tokenVersion/isAdmin injected into the staff-creation body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/staff')
        .set('Cookie', cookie)
        .send({
          email: 'new-staff@armalytech.com',
          password: 'temp-password',
          role: 'owner',
          isAdmin: true,
          tokenVersion: 999,
        });

      expect(res.status).toBe(201);
      // CreateStaffDto has no `role` field: whitelist strips it, and the
      // use case always forces the new account to the "admin" role.
      expect(res.body.data.role).toBe('admin');
    });

    it('ignores a privileged tokenVersion/isAdmin injected into the account-update body', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/account/email')
        .set('Cookie', cookie)
        .send({
          newEmail: 'mass-admin-new@armalytech.com',
          currentPassword: adminPassword,
          role: 'owner',
          isAdmin: true,
          tokenVersion: 999,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('mass-admin-new@armalytech.com');
      // The response only ever echoes id/email; tokenVersion/isAdmin were
      // never accepted as input in the first place (stripped by whitelist).
      expect(res.body.data).not.toHaveProperty('isAdmin');
      // Email changes bump tokenVersion and re-issue the cookie (see JWT
      // tampering block above): refresh it so later tests in this describe
      // keep using a still-valid session instead of the now-stale one.
      cookie = setCookieHeader(res);
      expect(res.body.data).not.toHaveProperty('tokenVersion');
    });

    it('ignores privileged fields injected into a product-creation body', async () => {
      const categoryRes = await request(app.getHttpServer())
        .post('/api/inventory/categories')
        .set('Cookie', cookie)
        .send({ name: 'Mass Assignment Category' });
      expect(categoryRes.status).toBe(201);

      const productRes = await request(app.getHttpServer())
        .post('/api/inventory/products')
        .set('Cookie', cookie)
        .send({
          categoryId: categoryRes.body.data.id,
          name: 'Mass Assignment Product',
          stock: 5,
          cost: 10,
          salePrice: 20,
          minStock: 1,
          role: 'owner',
          isAdmin: true,
          tokenVersion: 999,
        });

      expect(productRes.status).toBe(201);
      expect(productRes.body.data).not.toHaveProperty('role');
      expect(productRes.body.data).not.toHaveProperty('isAdmin');
    });
  });

  describe('Brute force protection', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    const adminEmail = 'brute-admin@armalytech.com';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: 'Sup3r-Secret-Password!',
      }));
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it('throttles repeated failed logins (limit: 5/60s per existing config)', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: adminEmail, password: `wrong-${i}` });
        statuses.push(res.status);
      }

      expect(statuses.slice(0, 5)).not.toContain(429);
      expect(statuses[5]).toBe(429);
    });
  });

  describe('Unauthenticated access to protected routes', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({ JWT_SECRET }));
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it.each([
      ['GET', '/api/inventory/products'],
      ['GET', '/api/inventory/brands'],
      ['GET', '/api/cash-closings'],
      ['GET', '/api/community/clients'],
      ['GET', '/api/staff'],
      ['PATCH', '/api/account/email'],
    ])('rejects %s %s without a session cookie', async (method, path) => {
      const res = await (
        request(app.getHttpServer()) as unknown as Record<
          string,
          (p: string) => request.Test
        >
      )[method.toLowerCase()](path);

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('keeps /community/register public', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/community/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          phone: '+10000000000',
          marketingConsent: true,
        });

      expect(res.status).not.toBe(401);
    });
  });

  describe('Cookie flags on login', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    const adminEmail = 'cookie-admin@armalytech.com';
    const adminPassword = 'Sup3r-Secret-Password!';

    beforeAll(async () => {
      ({ app, mongod } = await createTestApp({
        JWT_SECRET,
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: adminPassword,
      }));
    });

    afterAll(async () => {
      await closeTestApp(app, mongod);
    });

    it('sets HttpOnly and SameSite on the session cookie (Secure only in production)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });

      const cookie = setCookieHeader(res);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      // NODE_ENV is 'test' here, matching the controller's
      // `secure: NODE_ENV === 'production'` behavior.
      expect(cookie).not.toMatch(/;\s*Secure/i);
    });
  });
});
