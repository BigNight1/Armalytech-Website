import { HandleKapsoWebhookUseCase } from '../handle-kapso-webhook.use-case';
import { FakeClientRepository } from '../../../community/application/__tests__/fakes';
import {
  FakeWhatsAppContactRepository,
  FakeWhatsAppMessageRepository,
} from '../../__tests__/fakes';
import { isValidKapsoSignature } from '../../infrastructure/kapso-webhook-signature';
import { createHmac } from 'node:crypto';

const PHONE = '51987654321';
const EPOCH = 1_760_000_000; // seconds

function received(message: Record<string, unknown>, conversation?: unknown) {
  return {
    message: { id: 'wamid.IN1', timestamp: String(EPOCH), ...message },
    conversation,
    phone_number_id: '961761267022319',
  };
}

describe('HandleKapsoWebhookUseCase', () => {
  let messages: FakeWhatsAppMessageRepository;
  let contacts: FakeWhatsAppContactRepository;
  let clients: FakeClientRepository;
  let useCase: HandleKapsoWebhookUseCase;

  beforeEach(() => {
    messages = new FakeWhatsAppMessageRepository();
    contacts = new FakeWhatsAppContactRepository();
    clients = new FakeClientRepository();
    useCase = new HandleKapsoWebhookUseCase(messages, contacts, clients);
    clients.clients.push({
      id: 'client-1',
      firstName: 'Andrea',
      lastName: 'Salazar',
      phoneE164: PHONE,
      marketingConsent: true,
      consentAt: new Date(),
      channel: 'manual',
      visitCount: 0,
      stamps: 0,
      loyaltyCycle: 1,
      rewardsClaimed: 0,
    });
  });

  const seedMessage = async (wamid = 'wamid.OUT1') =>
    messages.create({
      ticketId: 't1',
      template: 'ticket_listo',
      to: PHONE,
      wamid,
      status: 'sent',
      insideServiceWindow: false,
      trigger: 'manual',
      sentAt: new Date(EPOCH * 1000 - 60_000),
      statusAt: new Date(EPOCH * 1000 - 60_000),
    });

  describe('whatsapp.message.received', () => {
    it('touches lastInboundAt from message.from, normalizing the number', async () => {
      await useCase.execute(
        'whatsapp.message.received',
        received({
          from: '+51 987 654 321',
          type: 'text',
          text: { body: 'hola' },
        }),
      );
      const contact = await contacts.findByPhone(PHONE);
      expect(contact?.lastInboundAt).toEqual(new Date(EPOCH * 1000));
      expect(contact?.marketingOptOutAt).toBeUndefined();
      expect(clients.clients[0].marketingConsent).toBe(true);
    });

    it('falls back to conversation.phone_number and to now without a timestamp', async () => {
      const before = Date.now();
      await useCase.execute('whatsapp.message.received', {
        message: { type: 'text', text: { body: 'hola' } },
        conversation: { phone_number: PHONE },
      });
      const contact = await contacts.findByPhone(PHONE);
      expect(contact?.lastInboundAt?.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('ignores invalid or missing phone numbers', async () => {
      await useCase.execute(
        'whatsapp.message.received',
        received({ from: '12345' }),
      );
      await useCase.execute('whatsapp.message.received', received({}));
      expect(contacts.contacts.size).toBe(0);
    });

    it.each([
      [
        'template quick-reply button text',
        {
          type: 'button',
          button: { text: 'Dejar de recibir promociones', payload: 'x' },
        },
      ],
      [
        'button payload',
        {
          type: 'button',
          button: { text: 'x', payload: 'DEJAR DE RECIBIR PROMOCIONES' },
        },
      ],
      [
        'interactive button_reply title',
        {
          type: 'interactive',
          interactive: {
            type: 'button_reply',
            button_reply: { id: '1', title: 'Dejar de recibir promociónes' },
          },
        },
      ],
      ['text BAJA', { type: 'text', text: { body: ' BAJA ' } }],
      [
        'text "baja." with punctuation',
        { type: 'text', text: { body: 'Baja.' } },
      ],
    ])('detects an opt-out from %s', async (_name, message) => {
      await useCase.execute(
        'whatsapp.message.received',
        received({ from: PHONE, ...message }),
      );
      const contact = await contacts.findByPhone(PHONE);
      expect(contact?.marketingOptOutAt).toEqual(new Date(EPOCH * 1000));
      expect(contact?.lastInboundAt).toEqual(new Date(EPOCH * 1000));
      expect(clients.clients[0].marketingConsent).toBe(false);
    });

    it('does not opt out on ordinary text that merely contains the word', async () => {
      await useCase.execute(
        'whatsapp.message.received',
        received({
          from: PHONE,
          type: 'text',
          text: { body: 'me dieron de baja del seguro, gracias' },
        }),
      );
      const contact = await contacts.findByPhone(PHONE);
      expect(contact?.marketingOptOutAt).toBeUndefined();
      expect(clients.clients[0].marketingConsent).toBe(true);
    });

    it('records the opt-out even when the contact has no client', async () => {
      clients.clients = [];
      await useCase.execute(
        'whatsapp.message.received',
        received({ from: PHONE, type: 'text', text: { body: 'baja' } }),
      );
      expect(
        (await contacts.findByPhone(PHONE))?.marketingOptOutAt,
      ).toBeDefined();
    });
  });

  describe('status events', () => {
    it('advances sent -> delivered -> read by wamid and never goes back', async () => {
      await seedMessage();
      const statusEvent = (name: string, ts: number) => ({
        message: {
          id: 'wamid.OUT1',
          to: PHONE,
          kapso: {
            statuses: [
              { id: 'wamid.OUT1', status: name, timestamp: String(ts) },
            ],
          },
        },
      });

      await useCase.execute(
        'whatsapp.message.delivered',
        statusEvent('delivered', EPOCH),
      );
      expect(messages.messages[0]).toMatchObject({
        status: 'delivered',
        statusAt: new Date(EPOCH * 1000),
      });

      await useCase.execute(
        'whatsapp.message.read',
        statusEvent('read', EPOCH + 5),
      );
      expect(messages.messages[0].status).toBe('read');

      // Late callbacks must not downgrade.
      await useCase.execute(
        'whatsapp.message.delivered',
        statusEvent('delivered', EPOCH),
      );
      await useCase.execute(
        'whatsapp.message.sent',
        statusEvent('sent', EPOCH - 10),
      );
      expect(messages.messages[0]).toMatchObject({
        status: 'read',
        statusAt: new Date((EPOCH + 5) * 1000),
      });
    });

    it('applies failed with the error from the last status entry, even after delivered', async () => {
      await seedMessage();
      await useCase.execute('whatsapp.message.delivered', {
        message: { id: 'wamid.OUT1' },
      });
      await useCase.execute('whatsapp.message.failed', {
        message: {
          id: 'wamid.OUT1',
          kapso: {
            statuses: [
              { status: 'sent', timestamp: String(EPOCH - 5) },
              {
                status: 'failed',
                timestamp: String(EPOCH),
                errors: [
                  {
                    code: 131049,
                    title: 'Healthy ecosystem',
                    message: 'Not delivered',
                  },
                ],
              },
            ],
          },
        },
      });
      expect(messages.messages[0]).toMatchObject({
        status: 'failed',
        statusAt: new Date(EPOCH * 1000),
        error: {
          code: '131049',
          title: 'Healthy ecosystem',
          message: 'Not delivered',
        },
      });
    });

    it('stores a generic error when a failed event carries no error details', async () => {
      await seedMessage();
      await useCase.execute('whatsapp.message.failed', {
        message: { id: 'wamid.OUT1' },
      });
      expect(messages.messages[0].error).toEqual({
        message: 'Delivery failed',
      });
    });

    it('ignores statuses for unknown messages', async () => {
      await expect(
        useCase.execute('whatsapp.message.delivered', {
          message: { id: 'wamid.UNKNOWN' },
        }),
      ).resolves.toBeUndefined();
      expect(messages.messages).toHaveLength(0);
    });
  });

  describe('defensive parsing', () => {
    it('ignores unknown events and malformed payloads without throwing', async () => {
      await seedMessage();
      for (const [event, payload] of [
        ['whatsapp.conversation.created', { message: { id: 'wamid.OUT1' } }],
        [undefined, {}],
        ['whatsapp.message.received', null],
        ['whatsapp.message.received', 'nope'],
        ['whatsapp.message.received', []],
        ['whatsapp.message.delivered', { message: 'x' }],
        ['whatsapp.message.delivered', { message: { id: 42 } }],
        [
          'whatsapp.message.failed',
          { message: { id: 'wamid.OUT1', kapso: { statuses: 'bad' } } },
        ],
      ] as [string | undefined, unknown][]) {
        await expect(useCase.execute(event, payload)).resolves.toBeUndefined();
      }
      expect(contacts.contacts.size).toBe(0);
      // The last case is a valid failed event with no details.
      expect(messages.messages[0].status).toBe('failed');
    });
  });
});

describe('isValidKapsoSignature', () => {
  const secret = 's3cret';
  const body = Buffer.from('{"message":{"id":"wamid.1"}}');
  const sign = (payload: Buffer | string, key = secret) =>
    createHmac('sha256', key).update(payload).digest('hex');

  it('accepts the HMAC-SHA256 hex of the raw body', () => {
    expect(isValidKapsoSignature(secret, body, sign(body))).toBe(true);
    expect(isValidKapsoSignature(secret, body, `sha256=${sign(body)}`)).toBe(
      true,
    );
    expect(isValidKapsoSignature(secret, body, sign(body).toUpperCase())).toBe(
      true,
    );
  });

  it('rejects wrong, tampered, truncated, missing or empty signatures', () => {
    expect(isValidKapsoSignature(secret, body, sign(body, 'other'))).toBe(
      false,
    );
    expect(
      isValidKapsoSignature(secret, Buffer.from('{"x":1}'), sign(body)),
    ).toBe(false);
    expect(isValidKapsoSignature(secret, body, sign(body).slice(0, 10))).toBe(
      false,
    );
    expect(isValidKapsoSignature(secret, body, undefined)).toBe(false);
    expect(isValidKapsoSignature(secret, body, '')).toBe(false);
    expect(isValidKapsoSignature(secret, undefined, sign(body))).toBe(false);
    expect(isValidKapsoSignature('', body, sign(body, ''))).toBe(false);
  });
});
