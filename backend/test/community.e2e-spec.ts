import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

/**
 * 2026-10-25 hardening (C4): `POST /api/community/register` is public and now
 * answers a projection only — `{ ok, data: { client: { firstName, stamps },
 * isNewClient } }` — and a repeat registration no longer rewrites the stored
 * names. Because the same change throttles the route to 5 requests/minute per
 * IP, the suite is split into two app instances: each one gets a fresh
 * in-memory throttler storage, so registration-heavy tests do not trip the
 * limit of an unrelated block.
 */
describe('Community registration (e2e)', () => {
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

  it('registers a new client without an admin session and answers only the public projection', async () => {
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
    // Exact shape on purpose: this `toEqual` is what forbids leaking
    // `phoneE164`, `consentAt`, `lastName`, dates or `visitCount` from a
    // public, unauthenticated endpoint.
    expect(res.body).toEqual({
      ok: true,
      data: {
        client: { firstName: 'Juana', stamps: 0 },
        isNewClient: true,
      },
    });

    // The parts the projection no longer returns are still stored correctly;
    // assert them through the authenticated panel instead of the public body.
    const stored = await agent
      .get('/api/community/clients')
      .query({ q: '965728013' });
    const juana = stored.body.data.items[0];
    expect(juana.phoneE164).toBe('51965728013');
    expect(juana.channel).toBe('nfc');
    // Only the technician's "+1 Visita" (registerVisit) increments visitCount;
    // registration itself never counts as a visit (loyalty rule, ADR 0013).
    expect(juana.visitCount).toBe(0);
  });

  it('recognizes a repeat submission, never rewrites the stored name, and does not count a visit', async () => {
    const anon = request(app.getHttpServer());
    await anon.post('/api/community/register').send({
      firstName: 'Beto',
      lastName: 'Diaz',
      phone: '987654321',
      marketingConsent: true,
    });

    const second = await anon.post('/api/community/register').send({
      firstName: 'Suplantador',
      lastName: 'Ajeno',
      phone: '+51 987 654 321',
      marketingConsent: true,
    });

    expect(second.status).toBe(201);
    expect(second.body).toEqual({
      ok: true,
      data: {
        client: { firstName: 'Beto', stamps: 0 },
        isNewClient: false,
      },
    });

    // The public form cannot rename an existing client: the stored document
    // keeps the original identity (2026-10-25 hardening, C4).
    const stored = await agent
      .get('/api/community/clients')
      .query({ q: '987654321' });
    const beto = stored.body.data.items[0];
    expect(beto.firstName).toBe('Beto');
    expect(beto.lastName).toBe('Diaz');
    // Repeat registration recognizes the client but does not add a visit.
    expect(beto.visitCount).toBe(0);
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

  it('throttles public registration at 5 requests per minute per IP', async () => {
    const anon = request(app.getHttpServer());
    const statuses: number[] = [];

    // Tolerant on purpose: this block shares its app instance with the tests
    // above, so some of the minute's allowance may already be spent. What must
    // hold is that no more than 5 requests get through and that the rest are
    // 429s.
    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await anon.post('/api/community/register').send({
        firstName: 'Throttle',
        lastName: `Case${i}`,
        phone: `91000000${i}`,
        marketingConsent: true,
      });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429);
    expect(
      statuses.filter((status) => status !== 429).length,
    ).toBeLessThanOrEqual(5);
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

    // The authenticated panel is the only path that may rename a client.
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

/**
 * Consent rules (ADR 0013 / 2026-09-25) no longer visible in the public
 * response, so they are verified through the admin panel. Own app instance:
 * the registration throttler above is already saturated.
 */
describe('Community consent on repeat registration (e2e)', () => {
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

  it('registers a client who declines marketing consent (2026-09-25: consent is optional)', async () => {
    const anon = request(app.getHttpServer());
    const res = await anon.post('/api/community/register').send({
      firstName: 'Sin',
      lastName: 'Consentimiento',
      phone: '911222333',
      marketingConsent: false,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.isNewClient).toBe(true);

    const stored = await agent
      .get('/api/community/clients')
      .query({ q: '911222333' });
    expect(stored.body.data.items[0].marketingConsent).toBe(false);
  });

  it('upgrades a declined consent to approved on repeat registration, never the reverse', async () => {
    const anon = request(app.getHttpServer());
    await anon.post('/api/community/register').send({
      firstName: 'Mario',
      lastName: 'Rios',
      phone: '922333444',
      marketingConsent: false,
    });

    const upgraded = await anon.post('/api/community/register').send({
      firstName: 'Mario',
      lastName: 'Rios',
      phone: '922333444',
      marketingConsent: true,
    });
    expect(upgraded.status).toBe(201);

    const afterUpgrade = await agent
      .get('/api/community/clients')
      .query({ q: '922333444' });
    expect(afterUpgrade.body.data.items[0].marketingConsent).toBe(true);

    const stillApproved = await anon.post('/api/community/register').send({
      firstName: 'Mario',
      lastName: 'Rios',
      phone: '922333444',
      marketingConsent: false,
    });
    expect(stillApproved.status).toBe(201);

    const afterDecline = await agent
      .get('/api/community/clients')
      .query({ q: '922333444' });
    expect(afterDecline.body.data.items[0].marketingConsent).toBe(true);
  });
});
