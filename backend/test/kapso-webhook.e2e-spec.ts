import { INestApplication } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';
import { WHATSAPP_SENDER } from '../src/whatsapp/domain/whatsapp-sender.port';
import { FakeWhatsAppSender } from '../src/whatsapp/__tests__/fakes';

const SECRET = 'kapso-test-webhook-secret';
const EPOCH_NOW = () => String(Math.floor(Date.now() / 1000));

describe('Kapso webhook (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let owner: ReturnType<typeof request.agent>;
  const sender = new FakeWhatsAppSender();
  let idempotencySeq = 0;

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
    delete process.env.KAPSO_WEBHOOK_SECRET;
    await closeTestApp(app, mongod);
  });

  const sign = (raw: string, secret = SECRET) =>
    createHmac('sha256', secret).update(raw).digest('hex');

  /** Posts the exact bytes of `body` with a signature computed over them. */
  function webhook(
    body: unknown,
    headers: Record<string, string> = {},
    options: { signature?: string | null } = {},
  ) {
    const raw = JSON.stringify(body);
    const req = request(app.getHttpServer())
      .post('/api/webhooks/kapso')
      .set('Content-Type', 'application/json')
      .set(headers);
    if (options.signature !== null) {
      req.set('X-Webhook-Signature', options.signature ?? sign(raw));
    }
    return req.send(raw);
  }

  async function createTicket(telefono: string) {
    const res = await owner.post('/api/tickets').send({
      cliente: { nombre: 'Andrea', telefono },
      equipo: { marca: 'Samsung', modelo: 'A53', fallaReportada: 'x' },
      titulo: 'Cambio de pantalla',
      precioTotal: 100,
    });
    expect(res.status).toBe(201);
    return res.body as { id: string };
  }

  const whatsappStatus = async (ticketId: string) =>
    (await owner.get(`/api/tickets/${ticketId}/whatsapp`).expect(200)).body;

  const receivedPayload = (from: string, message: Record<string, unknown>) => ({
    message: {
      id: `wamid.IN${++idempotencySeq}`,
      timestamp: EPOCH_NOW(),
      from,
      ...message,
    },
    conversation: { phone_number: from },
    is_new_conversation: false,
  });

  it('answers 503 while no webhook secret is configured', async () => {
    delete process.env.KAPSO_WEBHOOK_SECRET;
    const res = await webhook({ message: {} }, {}, { signature: 'abc' });
    expect(res.status).toBe(503);
  });

  describe('with a secret', () => {
    beforeAll(() => {
      process.env.KAPSO_WEBHOOK_SECRET = SECRET;
    });

    it('rejects missing and invalid signatures with 401', async () => {
      const event = { 'X-Webhook-Event': 'whatsapp.message.received' };
      const payload = receivedPayload('51987100001', { type: 'text' });

      expect((await webhook(payload, event, { signature: null })).status).toBe(
        401,
      );
      expect(
        (await webhook(payload, event, { signature: 'deadbeef' })).status,
      ).toBe(401);
      expect(
        (
          await webhook(payload, event, {
            signature: sign(JSON.stringify(payload), 'wrong-secret'),
          })
        ).status,
      ).toBe(401);
      // Signature of a different body (tampering after signing).
      expect(
        (
          await webhook(payload, event, {
            signature: sign(JSON.stringify({ ...payload, extra: 1 })),
          })
        ).status,
      ).toBe(401);
    });

    it('does not require an admin session and ignores unknown events with 200', async () => {
      const res = await webhook(
        { anything: true },
        { 'X-Webhook-Event': 'whatsapp.conversation.created' },
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('opens the 24 h window on an inbound message', async () => {
      const ticket = await createTicket('987100002');
      expect((await whatsappStatus(ticket.id)).window.open).toBe(false);

      await webhook(
        receivedPayload('51987100002', {
          type: 'text',
          text: { body: 'hola' },
        }),
        { 'X-Webhook-Event': 'whatsapp.message.received' },
      ).expect(200);

      const status = await whatsappStatus(ticket.id);
      expect(status.window.open).toBe(true);
      expect(Number.isNaN(Date.parse(status.window.lastInboundAt))).toBe(false);
    });

    it('registers a marketing opt-out from the quick-reply button and clears client consent', async () => {
      await request(app.getHttpServer())
        .post('/api/community/register')
        .query({ canal: 'nfc' })
        .send({
          firstName: 'Juana',
          lastName: 'Perez',
          phone: '987100003',
          marketingConsent: true,
        })
        .expect(201);
      const ticket = await createTicket('987100003');
      expect((await whatsappStatus(ticket.id)).marketing).toEqual({
        allowed: true,
      });

      await webhook(
        receivedPayload('51987100003', {
          type: 'button',
          button: { text: 'Dejar de recibir promociones', payload: 'opt_out' },
        }),
        { 'X-Webhook-Event': 'whatsapp.message.received' },
      ).expect(200);

      expect((await whatsappStatus(ticket.id)).marketing).toEqual({
        allowed: false,
        reason: 'opted_out',
      });
      const approved = await owner
        .get('/api/community/clients')
        .query({ q: '987100003', consent: 'approved' })
        .expect(200);
      expect(approved.body.data.total).toBe(0);
    });

    it('updates delivery statuses by wamid, never downgrading, and stores failures', async () => {
      const ticket = await createTicket('987100004');
      for (const state of ['aprobado', 'trabajando', 'listo']) {
        await owner
          .patch(`/api/tickets/${ticket.id}/status`)
          .send({ nuevoEstado: state })
          .expect(200);
      }
      const sent = await owner
        .post(`/api/tickets/${ticket.id}/whatsapp`)
        .send({ template: 'ticket_listo' })
        .expect(201);
      const wamid = 'wamid.FAKE' + sender.calls.length; // FakeWhatsAppSender numbering
      expect(sent.body.status).toBe('sent');

      const statusEvent = (
        name: string,
        extra: Record<string, unknown> = {},
      ) => ({
        message: {
          id: wamid,
          to: '51987100004',
          kapso: {
            statuses: [
              { id: wamid, status: name, timestamp: EPOCH_NOW(), ...extra },
            ],
          },
        },
      });
      const post = (event: string, body: unknown) =>
        webhook(body, { 'X-Webhook-Event': event }).expect(200);

      await post('whatsapp.message.read', statusEvent('read'));
      expect((await whatsappStatus(ticket.id)).items[0].status).toBe('read');

      await post('whatsapp.message.delivered', statusEvent('delivered'));
      expect((await whatsappStatus(ticket.id)).items[0].status).toBe('read');

      await post(
        'whatsapp.message.failed',
        statusEvent('failed', {
          errors: [
            {
              code: 131026,
              title: 'Undeliverable',
              message: 'Message undeliverable',
            },
          ],
        }),
      );
      const item = (await whatsappStatus(ticket.id)).items[0];
      expect(item.status).toBe('failed');
      expect(item.error).toEqual({
        code: '131026',
        title: 'Undeliverable',
        message: 'Message undeliverable',
      });
    });

    it('processes every item of a batch (header or body flag)', async () => {
      const a = await createTicket('987100005');
      const b = await createTicket('987100006');
      const c = await createTicket('987100007');

      await webhook(
        {
          type: 'whatsapp.message.received',
          batch: true,
          data: [
            receivedPayload('51987100005', {
              type: 'text',
              text: { body: 'a' },
            }),
            receivedPayload('51987100006', {
              type: 'text',
              text: { body: 'b' },
            }),
          ],
          batch_info: { size: 2 },
        },
        {
          'X-Webhook-Event': 'whatsapp.message.received',
          'X-Webhook-Batch': 'true',
        },
      ).expect(200);
      expect((await whatsappStatus(a.id)).window.open).toBe(true);
      expect((await whatsappStatus(b.id)).window.open).toBe(true);

      // Body flag only (no batch header).
      await webhook(
        {
          batch: true,
          data: [
            receivedPayload('51987100007', {
              type: 'text',
              text: { body: 'c' },
            }),
          ],
        },
        { 'X-Webhook-Event': 'whatsapp.message.received' },
      ).expect(200);
      expect((await whatsappStatus(c.id)).window.open).toBe(true);
    });

    it('ignores a repeated X-Idempotency-Key', async () => {
      const ticket = await createTicket('987100008');
      const event = { 'X-Webhook-Event': 'whatsapp.message.received' };
      const key = { 'X-Idempotency-Key': 'delivery-abc-123' };

      // First delivery for a different phone consumes the key...
      await webhook(
        receivedPayload('51987100009', { type: 'text', text: { body: 'x' } }),
        { ...event, ...key },
      ).expect(200);

      // ...so a retry carrying the same key (even with other content) is a no-op.
      const replay = await webhook(
        receivedPayload('51987100008', { type: 'text', text: { body: 'y' } }),
        { ...event, ...key },
      );
      expect(replay.status).toBe(200);
      expect(replay.body).toEqual({ ok: true });
      expect((await whatsappStatus(ticket.id)).window.open).toBe(false);

      // A new key is processed.
      await webhook(
        receivedPayload('51987100008', { type: 'text', text: { body: 'y' } }),
        { ...event, 'X-Idempotency-Key': 'delivery-abc-124' },
      ).expect(200);
      expect((await whatsappStatus(ticket.id)).window.open).toBe(true);
    });

    it('still answers 200 for malformed payloads with a valid signature', async () => {
      const event = { 'X-Webhook-Event': 'whatsapp.message.delivered' };
      expect((await webhook({ message: 'bad' }, event)).status).toBe(200);
      expect((await webhook([], event)).status).toBe(200);
      expect((await webhook({ batch: true, data: 'nope' }, event)).status).toBe(
        200,
      );
    });
  });
});
