import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

/** Full `Set-Cookie` header value (`name=value; Path=/; ...`) of a response. */
function setCookieHeader(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  expect(value).toBeDefined();
  return value as string;
}

/** Just the `name=value` pair, ready to send back as a `Cookie` header. */
function cookiePair(res: request.Response): string {
  return setCookieHeader(res).split(';')[0];
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  // ADR 0021: login is by email, not username. Set ADMIN_EMAIL explicitly
  // instead of relying on the ADMIN_USERNAME -> "<username>@armalytech.com"
  // fallback, so the contract under test is unambiguous.
  const adminEmail = 'admin@armalytech.com';

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: 'super-secret',
    }));
    // Bootstrap runs on onApplicationBootstrap, which `app.init()` already
    // triggered inside createTestApp.
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app.getHttpServer()).get('/api/inventory/brands');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('rejects login with wrong credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('logs in with the bootstrapped admin, sets a cookie, and allows /me and protected routes', async () => {
    const agent = request.agent(app.getHttpServer());

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'super-secret' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.email).toBe(adminEmail);
    expect(loginRes.headers['set-cookie']).toBeDefined();

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(adminEmail);

    const brandsRes = await agent.get('/api/inventory/brands');
    expect(brandsRes.status).toBe(200);
    expect(brandsRes.body.ok).toBe(true);

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  // 2026-10-25 hardening (C1): logout used to only delete the cookie, so a
  // copied token stayed valid for the rest of its 12 h. It now bumps
  // `tokenVersion`, which the guard compares on every request.
  it('revokes the session on logout: replaying the pre-logout cookie gives 401', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'super-secret' });
    expect(loginRes.status).toBe(200);

    // Keep a copy of the cookie: this is the "stolen token" the revocation
    // must kill, and this client never receives the clearing Set-Cookie.
    const stolenCookie = cookiePair(loginRes);

    const before = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', stolenCookie);
    expect(before.status).toBe(200);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', stolenCookie);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ ok: true });
    expect(setCookieHeader(logoutRes)).toMatch(/^armalytech_session=;/);

    const replay = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', stolenCookie);
    expect(replay.status).toBe(401);
    expect(replay.body.ok).toBe(false);

    // Revoking sessions does not lock the account: a fresh login still works.
    const relogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'super-secret' });
    expect(relogin.status).toBe(200);
  });

  it('logout is public and idempotent: 200 { ok: true } and a cleared cookie without a session', async () => {
    const withoutSession = await request(app.getHttpServer()).post(
      '/api/auth/logout',
    );
    expect(withoutSession.status).toBe(200);
    expect(withoutSession.body).toEqual({ ok: true });
    expect(setCookieHeader(withoutSession)).toMatch(/^armalytech_session=;/);

    // A tampered/garbage cookie must not turn logout into an error (it must
    // not reveal either whether it belonged to a real session).
    const withGarbageCookie = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'armalytech_session=not-a-jwt');
    expect(withGarbageCookie.status).toBe(200);
    expect(withGarbageCookie.body).toEqual({ ok: true });
  });
});
