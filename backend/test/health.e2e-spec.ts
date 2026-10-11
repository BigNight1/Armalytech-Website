import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('GET /api/health reports the db as connected, without auth', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.db.state).toBe('connected');
  });
});
