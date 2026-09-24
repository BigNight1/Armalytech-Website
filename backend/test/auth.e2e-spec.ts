import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'admin',
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
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('logs in with the bootstrapped admin, sets a cookie, and allows /me and protected routes', async () => {
    const agent = request.agent(app.getHttpServer());

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'super-secret' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.username).toBe('admin');
    expect(loginRes.headers['set-cookie']).toBeDefined();

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.username).toBe('admin');

    const brandsRes = await agent.get('/api/inventory/brands');
    expect(brandsRes.status).toBe(200);
    expect(brandsRes.body.ok).toBe(true);

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });
});
