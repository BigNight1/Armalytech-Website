import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

/**
 * 2026-10-25 hardening (C2 + C3).
 *
 * C3: the temporary password of a staff creation and the owner's password
 * reset moved from `@MinLength(6)` to `@MinLength(8)`, aligned with the
 * self-service password change.
 * C2: `PATCH /api/account/password` and `PATCH /api/account/email` verify the
 * current password, so they are limited to 10 requests/minute per IP.
 */
function errorMessage(res: request.Response): string {
  const message = res.body?.error?.message;
  return Array.isArray(message) ? message.join(' | ') : String(message ?? '');
}

describe('Password policy (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let owner: ReturnType<typeof request.agent>;
  const ownerPassword = 'super-secret';

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'owner',
      ADMIN_PASSWORD: ownerPassword,
    }));
    owner = request.agent(app.getHttpServer());
    await owner
      .post('/api/auth/login')
      .send({ username: 'owner', password: ownerPassword });
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('rejects a 7-character temporary password on staff creation', async () => {
    const res = await owner.post('/api/staff').send({
      email: 'corto@armalytech.com',
      password: '1234567',
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(errorMessage(res)).toMatch(/al menos 8 caracteres/);
  });

  it('rejects a 7-character password on the owner reset', async () => {
    const created = await owner.post('/api/staff').send({
      email: 'reset@armalytech.com',
      password: '12345678',
    });
    expect(created.status).toBe(201);
    const staffId = created.body.data.id;

    const res = await owner
      .post(`/api/staff/${staffId}/reset-password`)
      .send({ password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(errorMessage(res)).toMatch(/al menos 8 caracteres/);
  });

  it('rejects a 7-character new password on the self-service change', async () => {
    const res = await owner.patch('/api/account/password').send({
      currentPassword: ownerPassword,
      newPassword: '1234567',
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(errorMessage(res)).toMatch(/al menos 8 caracteres/);
  });
});

/**
 * Own app instance: `PATCH /api/account/password` above already spent one of
 * this minute's ten attempts on its handler.
 */
describe('Throttle on password-verifying account routes (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let owner: ReturnType<typeof request.agent>;
  const ownerPassword = 'super-secret';

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'owner',
      ADMIN_PASSWORD: ownerPassword,
    }));
    owner = request.agent(app.getHttpServer());
    await owner
      .post('/api/auth/login')
      .send({ username: 'owner', password: ownerPassword });
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  /**
   * Sends the burst with bodies that fail DTO validation: guards run before
   * pipes, so they still count against the throttler while staying fast (no
   * bcrypt compare per request). One real request first proves the route
   * itself answers normally.
   */
  async function statusesUntilThrottled(
    send: (index: number) => request.Test,
  ): Promise<number[]> {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await send(i);
      statuses.push(res.status);
    }
    return statuses;
  }

  it('limits PATCH /api/account/password to 10 requests per minute', async () => {
    const real = await owner.patch('/api/account/password').send({
      currentPassword: 'not-the-password',
      newPassword: 'another-password',
    });
    expect(real.status).toBe(401);

    // 9 more to reach the limit of 10, then the 11th must be throttled.
    const statuses = await statusesUntilThrottled(() =>
      owner.patch('/api/account/password').send({}),
    );

    expect(statuses.slice(0, 9)).not.toContain(429);
    expect(statuses[8]).toBe(400);
    expect(statuses[9]).toBe(429);
  });

  it('limits PATCH /api/account/email to 10 requests per minute', async () => {
    const statuses = await statusesUntilThrottled(() =>
      owner.patch('/api/account/email').send({}),
    );

    expect(statuses.slice(0, 10)).not.toContain(429);
    expect(statuses[9]).toBe(400);
    expect(statuses[10]).toBe(429);
  });
});
