import { ConfigService } from '@nestjs/config';
import { Ticket, TicketStatus } from '../../domain/ticket.entity';
import { ITicketRepository } from '../../domain/ticket.repository.port';
import { TicketCipherService } from '../../infrastructure/crypto/ticket-cipher.service';
import { TicketUseCases } from '../ticket.use-cases';
import { TicketWhatsAppService } from '../ticket-whatsapp.service';
import { FakeClientRepository } from '../../../community/application/__tests__/fakes';
import {
  FakeWhatsAppContactRepository,
  FakeWhatsAppMessageRepository,
  FakeWhatsAppSender,
} from '../../../whatsapp/__tests__/fakes';
import { WhatsAppSendError } from '../../../whatsapp/domain/whatsapp-sender.port';

function makeTicket(estado: TicketStatus) {
  return new Ticket({
    id: 'ticket-1',
    codigo: 'AT-000001',
    publicToken: 'public-token-abc',
    cliente: { nombre: 'Andrea', telefono: '51987654321' },
    equipo: { marca: 'Samsung', modelo: 'A53', fallaReportada: 'x' },
    titulo: 'Cambio de pantalla',
    piezas: [],
    precioTotal: 100,
    adelanto: 0,
    saldo: 100,
    estado,
    historialEstados: [],
    fechaIngreso: new Date(),
  });
}

describe('TicketUseCases.updateStatus WhatsApp auto notice', () => {
  let ticket: Ticket;
  let sender: FakeWhatsAppSender;
  let messages: FakeWhatsAppMessageRepository;
  let env: Record<string, string>;
  let useCases: TicketUseCases;

  beforeEach(() => {
    ticket = makeTicket(TicketStatus.TRABAJANDO);
    sender = new FakeWhatsAppSender();
    messages = new FakeWhatsAppMessageRepository();
    env = {};
    const repository = {
      findById: async (id: string) => (id === ticket.id ? ticket : null),
      update: async (t: Ticket) => t,
    } as unknown as ITicketRepository;
    const config = {
      get: (key: string) => env[key],
    } as unknown as ConfigService;
    const whatsapp = new TicketWhatsAppService(
      repository,
      sender,
      messages,
      new FakeWhatsAppContactRepository(),
      new FakeClientRepository(),
      config,
    );
    const cipher = new TicketCipherService({
      get: () => 'test-key-32-chars-long-for-aes256',
    } as unknown as ConfigService);
    useCases = new TicketUseCases(
      repository,
      cipher,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      whatsapp,
    );
  });

  it('sends ticket_listo automatically when the flag is on', async () => {
    env.WHATSAPP_AUTO_TICKET_LISTO = 'true';

    const updated = await useCases.updateStatus(
      'ticket-1',
      { nuevoEstado: TicketStatus.LISTO },
      { usuarioId: 'u1', usuarioEmail: 'tec@armalytech.com' },
    );

    expect(updated.estado).toBe(TicketStatus.LISTO);
    expect(sender.calls).toHaveLength(1);
    expect(sender.calls[0].template).toBe('ticket_listo');
    expect(messages.messages[0]).toMatchObject({
      trigger: 'auto',
      status: 'sent',
      sentByEmail: 'tec@armalytech.com',
    });
  });

  it('does nothing when the flag is off or unset', async () => {
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.LISTO,
    });
    expect(sender.calls).toHaveLength(0);

    ticket = makeTicket(TicketStatus.TRABAJANDO);
    env.WHATSAPP_AUTO_TICKET_LISTO = 'false';
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.LISTO,
    });
    expect(sender.calls).toHaveLength(0);
    expect(messages.messages).toHaveLength(0);
  });

  it('does not send for transitions other than listo', async () => {
    env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
    ticket = makeTicket(TicketStatus.PENDIENTE);
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.CANCELADO,
    });
    expect(sender.calls).toHaveLength(0);
  });

  it('never blocks the status change when the provider fails', async () => {
    env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
    sender.failWith = new WhatsAppSendError('Kapso down', '500');

    const updated = await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.LISTO,
    });

    expect(updated.estado).toBe(TicketStatus.LISTO);
    expect(messages.messages).toHaveLength(1);
    expect(messages.messages[0].status).toBe('failed');
  });

  it('never blocks the status change on unexpected errors', async () => {
    env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
    sender.failWith = new TypeError('unexpected');

    await expect(
      useCases.updateStatus('ticket-1', { nuevoEstado: TicketStatus.LISTO }),
    ).resolves.toMatchObject({ estado: TicketStatus.LISTO });
  });

  it('skips silently when the notice was already sent (listo -> trabajando -> listo)', async () => {
    env.WHATSAPP_AUTO_TICKET_LISTO = 'true';
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.LISTO,
    });
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.TRABAJANDO,
    });
    await useCases.updateStatus('ticket-1', {
      nuevoEstado: TicketStatus.LISTO,
    });

    expect(sender.calls).toHaveLength(1);
    expect(messages.messages).toHaveLength(1);
  });

  it('works without the WhatsApp service (optional dependency)', async () => {
    const repository = {
      findById: async () => ticket,
      update: async (t: Ticket) => t,
    } as unknown as ITicketRepository;
    const plain = new TicketUseCases(
      repository,
      {} as unknown as TicketCipherService,
    );
    await expect(
      plain.updateStatus('ticket-1', { nuevoEstado: TicketStatus.LISTO }),
    ).resolves.toMatchObject({ estado: TicketStatus.LISTO });
  });
});
