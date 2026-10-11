import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';
import {
  WHATSAPP_SENDER,
  WhatsAppNotConfiguredError,
  WhatsAppSendError,
} from '../src/whatsapp/domain/whatsapp-sender.port';
import { FakeWhatsAppSender } from '../src/whatsapp/__tests__/fakes';

describe('Ticket WhatsApp (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let owner: ReturnType<typeof request.agent>;
  const sender = new FakeWhatsAppSender();

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp(
      { ADMIN_USERNAME: 'owner', ADMIN_PASSWORD: 'super-secret-owner' },
      (builder) => builder.overrideProvider(WHATSAPP_SENDER).useValue(sender),
    ));
    owner = request.agent(app.getHttpServer());
    await owner
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'super-secret-owner' });
  });

  afterAll(async () => {
    delete process.env.WHATSAPP_AUTO_TICKET_LISTO;
    await closeTestApp(app, mongod);
  });

  beforeEach(() => {
    sender.calls = [];
    sender.failWith = undefined;
  });

  async function createTicket(telefono: string, nombre = 'Andrea Maria') {
    const res = await owner.post('/api/tickets').send({
      cliente: { nombre, telefono },
      equipo: { marca: 'Samsung', modelo: 'Galaxy A53', fallaReportada: 'x' },
      titulo: 'Cambio de pantalla',
      precioTotal: 100,
    });
    expect(res.status).toBe(201);
    return res.body as { id: string; codigo: string; publicToken: string };
  }

  async function setStatus(id: string, nuevoEstado: string) {
    await owner
      .patch(`/api/tickets/${id}/status`)
      .send({ nuevoEstado })
      .expect(200);
  }

  async function walkTo(id: string, ...states: string[]) {
    for (const state of states) await setStatus(id, state);
  }

  it('requires a session and validates the body', async () => {
    const ticket = await createTicket('987000001');
    await request(app.getHttpServer())
      .get(`/api/tickets/${ticket.id}/whatsapp`)
      .expect(401);
    await request(app.getHttpServer())
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' })
      .expect(401);
    await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'otra_cosa' })
      .expect(400);
  });

  it('GET returns an empty log, a closed window and no_client for a fresh ticket', async () => {
    const ticket = await createTicket('987000002');
    const res = await owner
      .get(`/api/tickets/${ticket.id}/whatsapp`)
      .expect(200);
    expect(res.body).toEqual({
      items: [],
      window: { open: false, lastInboundAt: null },
      marketing: { allowed: false, reason: 'no_client' },
    });
  });

  it('rejects ticket_listo outside the listo state with 409 invalid_state', async () => {
    const ticket = await createTicket('987000003');
    const res = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('invalid_state');
    expect(res.body.error.message).toBe('invalid_state');
    expect(sender.calls).toHaveLength(0);
  });

  it('sends ticket_listo, blocks a duplicate and allows a forced resend', async () => {
    const ticket = await createTicket('987000004');
    await walkTo(ticket.id, 'aprobado', 'trabajando', 'listo');

    const sent = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({
      template: 'ticket_listo',
      to: '51987000004',
      status: 'sent',
      insideServiceWindow: false,
      trigger: 'manual',
      sentByEmail: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(sent.body.sentAt))).toBe(false);
    expect(Number.isNaN(Date.parse(sent.body.statusAt))).toBe(false);
    expect(sender.calls[0]).toEqual({
      to: '51987000004',
      template: 'ticket_listo',
      languageCode: 'es',
      bodyParams: ['Andrea', 'Samsung Galaxy A53', ticket.codigo],
      urlButton: { index: 1, param: ticket.publicToken },
    });

    const dup = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('already_sent');
    expect(sender.calls).toHaveLength(1);

    await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo', force: true })
      .expect(201);
    expect(sender.calls).toHaveLength(2);

    const log = await owner
      .get(`/api/tickets/${ticket.id}/whatsapp`)
      .expect(200);
    expect(log.body.items).toHaveLength(2);
  });

  it('answers 422 invalid_phone for an unusable number', async () => {
    const ticket = await createTicket('12345');
    await walkTo(ticket.id, 'aprobado', 'trabajando', 'listo');
    const res = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('invalid_phone');
  });

  it('answers 502 whatsapp_send_failed with the provider detail and keeps a failed record', async () => {
    const ticket = await createTicket('987000005');
    await walkTo(ticket.id, 'aprobado', 'trabajando', 'listo');
    sender.failWith = new WhatsAppSendError(
      'Number of parameters does not match',
      '132000',
      'OAuthException',
    );

    const res = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('whatsapp_send_failed');
    expect(res.body.error.message).toBe('whatsapp_send_failed');
    expect(res.body.error.detail).toContain(
      'Number of parameters does not match',
    );

    const log = await owner
      .get(`/api/tickets/${ticket.id}/whatsapp`)
      .expect(200);
    expect(log.body.items).toHaveLength(1);
    expect(log.body.items[0]).toMatchObject({
      status: 'failed',
      error: { code: '132000', title: 'OAuthException' },
    });

    // A failed attempt does not count as sent: a retry goes through.
    sender.failWith = undefined;
    await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' })
      .expect(201);
  });

  it('answers 503 whatsapp_not_configured when the adapter has no credentials', async () => {
    const ticket = await createTicket('987000006');
    await walkTo(ticket.id, 'aprobado', 'trabajando', 'listo');
    sender.failWith = new WhatsAppNotConfiguredError();

    const res = await owner
      .post(`/api/tickets/${ticket.id}/whatsapp`)
      .send({ template: 'ticket_listo' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('whatsapp_not_configured');
  });

  it('resena_google: 403 without marketing consent, 201 with it', async () => {
    const noConsent = await createTicket('987000007');
    await walkTo(noConsent.id, 'aprobado', 'trabajando', 'listo', 'entregado');
    const denied = await owner
      .post(`/api/tickets/${noConsent.id}/whatsapp`)
      .send({ template: 'resena_google' });
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('marketing_not_allowed');

    await request(app.getHttpServer())
      .post('/api/community/register')
      .query({ canal: 'nfc' })
      .send({
        firstName: 'Juana',
        lastName: 'Perez',
        phone: '987000008',
        marketingConsent: true,
      })
      .expect(201);

    const consented = await createTicket('987000008', 'Juana');
    const early = await owner
      .post(`/api/tickets/${consented.id}/whatsapp`)
      .send({ template: 'resena_google' });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('invalid_state');

    await walkTo(consented.id, 'aprobado', 'trabajando', 'listo', 'entregado');
    const status = await owner
      .get(`/api/tickets/${consented.id}/whatsapp`)
      .expect(200);
    expect(status.body.marketing).toEqual({ allowed: true });

    const ok = await owner
      .post(`/api/tickets/${consented.id}/whatsapp`)
      .send({ template: 'resena_google' });
    expect(ok.status).toBe(201);
    expect(sender.calls.at(-1)).toEqual({
      to: '51987000008',
      template: 'resena_google',
      languageCode: 'es',
      bodyParams: ['Juana'],
    });
  });

  it('sends ticket_listo automatically on the listo transition only when the flag is on', async () => {
    const off = await createTicket('987000009');
    await walkTo(off.id, 'aprobado', 'trabajando', 'listo');
    expect(sender.calls).toHaveLength(0);

    process.env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
    try {
      const on = await createTicket('987000010');
      await walkTo(on.id, 'aprobado', 'trabajando', 'listo');
      expect(sender.calls).toHaveLength(1);
      expect(sender.calls[0].to).toBe('51987000010');

      const log = await owner.get(`/api/tickets/${on.id}/whatsapp`);
      expect(log.body.items[0]).toMatchObject({
        trigger: 'auto',
        status: 'sent',
      });

      // Provider failure must not break the status change.
      sender.failWith = new WhatsAppSendError('Kapso down', '500');
      const failing = await createTicket('987000011');
      await walkTo(failing.id, 'aprobado', 'trabajando');
      const res = await owner
        .patch(`/api/tickets/${failing.id}/status`)
        .send({ nuevoEstado: 'listo' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('listo');
    } finally {
      delete process.env.WHATSAPP_AUTO_TICKET_LISTO;
    }
  });
});
