import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Community (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'super-secret',
    }));
    agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'super-secret' });
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('registers a new client without an admin session (public route)', async () => {
    const anon = request(app.getHttpServer());
    const res = await anon
      .post('/api/community/register')
      .query({ canal: 'nfc' })
      .send({
        firstName: 'Juana',
        lastName: 'Perez',
        phone: '965728013',
        marketingConsent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isNewClient).toBe(true);
    expect(res.body.data.client.phoneE164).toBe('51965728013');
    expect(res.body.data.client.channel).toBe('nfc');
    expect(res.body.data.visitCount).toBe(1);
  });

  it('counts a repeat submission as a visit, not a new client', async () => {
    const anon = request(app.getHttpServer());
    await anon.post('/api/community/register').send({
      firstName: 'Beto',
      lastName: 'Diaz',
      phone: '987654321',
      marketingConsent: true,
    });

    const second = await anon.post('/api/community/register').send({
      firstName: 'Beto',
      lastName: 'Diaz',
      phone: '+51 987 654 321',
      marketingConsent: true,
    });

    expect(second.status).toBe(201);
    expect(second.body.data.isNewClient).toBe(false);
    expect(second.body.data.visitCount).toBe(2);
  });

  it('rejects an invalid phone number with 422 and logs the rejection', async () => {
    const anon = request(app.getHttpServer());
    const res = await anon.post('/api/community/register').send({
      firstName: 'X',
      lastName: 'Y',
      phone: '123456789',
      marketingConsent: true,
    });

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);

    const events = await agent
      .get('/api/community/events')
      .query({ type: 'registro_rechazado' });
    expect(events.body.data.length).toBeGreaterThan(0);
    expect(events.body.data[0].rejectReason).toBe('numero_invalido');
  });

  it('rejects a registration without marketing consent', async () => {
    const anon = request(app.getHttpServer());
    const res = await anon.post('/api/community/register').send({
      firstName: 'Sin',
      lastName: 'Consentimiento',
      phone: '911222333',
      marketingConsent: false,
    });

    expect(res.status).toBe(422);
  });

  it('lists, searches, fetches, and updates clients from the admin panel', async () => {
    const list = await agent
      .get('/api/community/clients')
      .query({ q: 'juana' });
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBeGreaterThanOrEqual(1);
    const clientId = list.body.data.items[0].id;

    const single = await agent.get(`/api/community/clients/${clientId}`);
    expect(single.status).toBe(200);
    expect(single.body.data.id).toBe(clientId);

    const updated = await agent
      .patch(`/api/community/clients/${clientId}`)
      .send({ firstName: 'Juana Maria' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.firstName).toBe('Juana Maria');

    const history = await agent.get(
      `/api/community/clients/${clientId}/events`,
    );
    expect(history.status).toBe(200);
    expect(history.body.data[0].type).toBe('registro');
  });

  it('returns 404 for an unknown client id', async () => {
    const res = await agent.get(`/api/community/clients/${'0'.repeat(24)}`);
    expect(res.status).toBe(404);
  });
});
