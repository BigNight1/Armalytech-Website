import { ConfigService } from '@nestjs/config';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { ITicketRepository } from '../../domain/ticket.repository.port';
import {
  TicketWhatsAppError,
  TicketWhatsAppService,
} from '../ticket-whatsapp.service';
import { FakeClientRepository } from '../../../community/application/__tests__/fakes';
import {
  FakeWhatsAppContactRepository,
  FakeWhatsAppMessageRepository,
  FakeWhatsAppSender,
} from '../../../whatsapp/__tests__/fakes';
import {
  WhatsAppNotConfiguredError,
  WhatsAppSendError,
} from '../../../whatsapp/domain/whatsapp-sender.port';

const PHONE = '51987654321';

function makeTicket(
  overrides: Partial<ConstructorParameters<typeof Ticket>[0]> = {},
) {
  return new Ticket({
    id: 'ticket-1',
    codigo: 'AT-000001',
    publicToken: 'public-token-abc',
    cliente: { nombre: 'Andrea Maria', apellido: 'Salazar', telefono: PHONE },
    equipo: { marca: 'Samsung', modelo: 'Galaxy A53', fallaReportada: 'x' },
    titulo: 'Cambio de pantalla',
    piezas: [],
    precioTotal: 100,
    adelanto: 0,
    saldo: 100,
    estado: TicketStatus.LISTO,
    historialEstados: [],
    fechaIngreso: new Date(),
    ...overrides,
  });
}

describe('TicketWhatsAppService', () => {
  let tickets: Map<string, Ticket>;
  let sender: FakeWhatsAppSender;
  let messages: FakeWhatsAppMessageRepository;
  let contacts: FakeWhatsAppContactRepository;
  let clients: FakeClientRepository;
  let env: Record<string, string>;
  let service: TicketWhatsAppService;

  const put = (ticket: Ticket) => tickets.set(ticket.id!, ticket);
  const addClient = (marketingConsent: boolean) => {
    clients.clients.push({
      id: 'client-1',
      firstName: 'Andrea',
      lastName: 'Salazar',
      phoneE164: PHONE,
      marketingConsent,
      consentAt: new Date(),
      channel: 'manual',
      visitCount: 0,
      stamps: 0,
      loyaltyCycle: 1,
      rewardsClaimed: 0,
    });
  };

  beforeEach(() => {
    tickets = new Map();
    sender = new FakeWhatsAppSender();
    messages = new FakeWhatsAppMessageRepository();
    contacts = new FakeWhatsAppContactRepository();
    clients = new FakeClientRepository();
    env = {};
    const ticketRepository = {
      findById: async (id: string) => tickets.get(id) ?? null,
    } as unknown as ITicketRepository;
    const config = {
      get: (key: string) => env[key],
    } as unknown as ConfigService;
    service = new TicketWhatsAppService(
      ticketRepository,
      sender,
      messages,
      contacts,
      clients,
      config,
    );
    put(makeTicket());
  });

  const expectCode = async (promise: Promise<unknown>, code: string) => {
    const error: unknown = await promise.catch((e) => e);
    expect(error).toBeInstanceOf(TicketWhatsAppError);
    expect((error as TicketWhatsAppError).code).toBe(code);
  };

  describe('send ticket_listo', () => {
    it('sends the template with the contract params and stores the message', async () => {
      const message = await service.send('ticket-1', 'ticket_listo', {
        trigger: 'manual',
        user: { usuarioId: 'u1', usuarioEmail: 'tec@armalytech.com' },
      });

      expect(sender.calls).toEqual([
        {
          to: PHONE,
          template: 'ticket_listo',
          languageCode: 'es',
          bodyParams: ['Andrea', 'Samsung Galaxy A53', 'AT-000001'],
          urlButton: { index: 1, param: 'public-token-abc' },
        },
      ]);
      expect(message).toMatchObject({
        ticketId: 'ticket-1',
        template: 'ticket_listo',
        to: PHONE,
        status: 'sent',
        wamid: 'wamid.FAKE1',
        trigger: 'manual',
        sentById: 'u1',
        sentByEmail: 'tec@armalytech.com',
        insideServiceWindow: false,
      });
      expect(messages.messages).toHaveLength(1);
    });

    it('does not require marketing consent (utility template)', async () => {
      addClient(false);
      await expect(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
      ).resolves.toBeDefined();
    });

    it('falls back to "equipo" when brand and model are missing and sanitizes params', async () => {
      put(
        makeTicket({
          cliente: { nombre: '  Luis\nPerez ', telefono: '+51 987 654 321' },
          equipo: { fallaReportada: 'x' },
        }),
      );
      await service.send('ticket-1', 'ticket_listo', { trigger: 'manual' });
      expect(sender.calls[0].bodyParams).toEqual([
        'Luis',
        'equipo',
        'AT-000001',
      ]);
      expect(sender.calls[0].to).toBe(PHONE);
    });

    it('rejects any state other than listo with invalid_state', async () => {
      put(makeTicket({ estado: TicketStatus.TRABAJANDO }));
      await expectCode(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
        'invalid_state',
      );
      expect(sender.calls).toHaveLength(0);
    });

    it('answers ticket_not_found for an unknown ticket', async () => {
      await expectCode(
        service.send('nope', 'ticket_listo', { trigger: 'manual' }),
        'ticket_not_found',
      );
    });

    it('answers invalid_phone when the number is not a valid Peruvian mobile', async () => {
      put(makeTicket({ cliente: { nombre: 'Ana', telefono: '12345' } }));
      await expectCode(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
        'invalid_phone',
      );
      expect(sender.calls).toHaveLength(0);
    });
  });

  describe('once per ticket and template', () => {
    it('rejects a second send with already_sent unless force is set', async () => {
      await service.send('ticket-1', 'ticket_listo', { trigger: 'manual' });

      await expectCode(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
        'already_sent',
      );
      expect(sender.calls).toHaveLength(1);

      await service.send('ticket-1', 'ticket_listo', {
        trigger: 'manual',
        force: true,
      });
      expect(sender.calls).toHaveLength(2);
      expect(messages.messages).toHaveLength(2);
    });

    it('does not count a failed attempt as already sent', async () => {
      sender.failWith = new WhatsAppSendError('boom', '131000');
      await expectCode(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
        'whatsapp_send_failed',
      );

      sender.failWith = undefined;
      await expect(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
      ).resolves.toMatchObject({ status: 'sent' });
    });
  });

  describe('failures', () => {
    it('persists a failed message with the provider error and throws whatsapp_send_failed', async () => {
      sender.failWith = new WhatsAppSendError(
        'Number of parameters does not match',
        '132000',
        'OAuthException',
      );

      const error = await service
        .send('ticket-1', 'ticket_listo', { trigger: 'auto' })
        .catch((e) => e);

      expect(error).toBeInstanceOf(TicketWhatsAppError);
      expect(error.code).toBe('whatsapp_send_failed');
      expect(error.detail).toContain('Number of parameters does not match');
      expect(messages.messages).toHaveLength(1);
      expect(messages.messages[0].wamid).toBeUndefined();
      expect(messages.messages[0]).toMatchObject({
        status: 'failed',
        trigger: 'auto',
        error: {
          code: '132000',
          title: 'OAuthException',
          message: 'Number of parameters does not match',
        },
      });
    });

    it('maps a not-configured sender to whatsapp_not_configured and stores nothing', async () => {
      sender.failWith = new WhatsAppNotConfiguredError();
      await expectCode(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
        'whatsapp_not_configured',
      );
      expect(messages.messages).toHaveLength(0);
    });

    it('rethrows unexpected errors untouched', async () => {
      sender.failWith = new TypeError('bug');
      await expect(
        service.send('ticket-1', 'ticket_listo', { trigger: 'manual' }),
      ).rejects.toBeInstanceOf(TypeError);
    });
  });

  describe('send resena_google', () => {
    beforeEach(() => {
      put(makeTicket({ estado: TicketStatus.ENTREGADO }));
    });

    it('sends only the first name when the client consented', async () => {
      addClient(true);
      await service.send('ticket-1', 'resena_google', { trigger: 'manual' });
      expect(sender.calls[0]).toEqual({
        to: PHONE,
        template: 'resena_google',
        languageCode: 'es',
        bodyParams: ['Andrea'],
      });
    });

    it('requires the entregado state', async () => {
      addClient(true);
      put(makeTicket({ estado: TicketStatus.LISTO }));
      await expectCode(
        service.send('ticket-1', 'resena_google', { trigger: 'manual' }),
        'invalid_state',
      );
    });

    it('rejects with marketing_not_allowed without a client, without consent, or after opt-out', async () => {
      await expectCode(
        service.send('ticket-1', 'resena_google', { trigger: 'manual' }),
        'marketing_not_allowed',
      );

      addClient(false);
      await expectCode(
        service.send('ticket-1', 'resena_google', { trigger: 'manual' }),
        'marketing_not_allowed',
      );

      clients.clients[0].marketingConsent = true;
      await contacts.markOptOut(PHONE, new Date());
      await expectCode(
        service.send('ticket-1', 'resena_google', { trigger: 'manual' }),
        'marketing_not_allowed',
      );
      expect(sender.calls).toHaveLength(0);
    });

    it('finds the client by clienteId before falling back to the phone', async () => {
      addClient(true);
      put(
        makeTicket({
          estado: TicketStatus.ENTREGADO,
          cliente: {
            clienteId: 'client-1',
            nombre: 'Andrea',
            telefono: PHONE,
          },
        }),
      );
      await expect(
        service.send('ticket-1', 'resena_google', { trigger: 'manual' }),
      ).resolves.toMatchObject({ clientId: 'client-1' });
    });
  });

  describe('getStatus', () => {
    it('returns items newest first, a closed window and marketing reasons', async () => {
      const first = await service.send('ticket-1', 'ticket_listo', {
        trigger: 'manual',
      });

      const status = await service.getStatus('ticket-1');

      expect(status.items.map((m) => m.id)).toEqual([first.id]);
      expect(status.window).toEqual({ open: false, lastInboundAt: null });
      expect(status.marketing).toEqual({ allowed: false, reason: 'no_client' });
    });

    it('reports an open window when the last inbound is under 24 h old', async () => {
      const lastInboundAt = new Date(Date.now() - 60 * 60 * 1000);
      await contacts.touchInbound(PHONE, lastInboundAt);

      const status = await service.getStatus('ticket-1');
      expect(status.window).toEqual({ open: true, lastInboundAt });

      // The window is also flagged on messages sent while it is open.
      const message = await service.send('ticket-1', 'ticket_listo', {
        trigger: 'manual',
      });
      expect(message.insideServiceWindow).toBe(true);
    });

    it('reports a closed window when the last inbound is 24 h old or more', async () => {
      const lastInboundAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await contacts.touchInbound(PHONE, lastInboundAt);
      const status = await service.getStatus('ticket-1');
      expect(status.window).toEqual({ open: false, lastInboundAt });
    });

    it('reports marketing reasons: no_consent, opted_out, allowed', async () => {
      addClient(false);
      expect((await service.getStatus('ticket-1')).marketing).toEqual({
        allowed: false,
        reason: 'no_consent',
      });

      clients.clients[0].marketingConsent = true;
      expect((await service.getStatus('ticket-1')).marketing).toEqual({
        allowed: true,
      });

      await contacts.markOptOut(PHONE, new Date());
      expect((await service.getStatus('ticket-1')).marketing).toEqual({
        allowed: false,
        reason: 'opted_out',
      });
    });

    it('does not fail for a ticket with an invalid phone', async () => {
      put(makeTicket({ cliente: { nombre: 'Ana', telefono: 'abc' } }));
      const status = await service.getStatus('ticket-1');
      expect(status.window.open).toBe(false);
      expect(status.marketing.allowed).toBe(false);
    });

    it('throws ticket_not_found for an unknown ticket', async () => {
      await expectCode(service.getStatus('nope'), 'ticket_not_found');
    });
  });

  describe('isAutoTicketListoEnabled', () => {
    it('is true only for the exact string "true"', () => {
      expect(service.isAutoTicketListoEnabled()).toBe(false);
      env.WHATSAPP_AUTO_TICKET_LISTO = 'false';
      expect(service.isAutoTicketListoEnabled()).toBe(false);
      env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
      expect(service.isAutoTicketListoEnabled()).toBe(true);
    });
  });
});
