import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ticket, TicketStatus } from '../domain/ticket.entity';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../domain/ticket.repository.port';
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from '../../community/domain/client-repository.port';
import { Client } from '../../community/domain/client.entity';
import { PhoneNumber } from '../../community/domain/phone-number.vo';
import {
  WHATSAPP_SENDER,
  SendTemplateInput,
  WhatsAppNotConfiguredError,
  WhatsAppSender,
  WhatsAppSendError,
} from '../../whatsapp/domain/whatsapp-sender.port';
import {
  WHATSAPP_MESSAGE_REPOSITORY,
  WhatsAppMessageRepository,
} from '../../whatsapp/domain/whatsapp-message-repository.port';
import {
  WHATSAPP_CONTACT_REPOSITORY,
  WhatsAppContactRepository,
} from '../../whatsapp/domain/whatsapp-contact-repository.port';
import { WhatsAppMessage } from '../../whatsapp/domain/whatsapp-message.entity';
import { isServiceWindowOpen } from '../../whatsapp/domain/whatsapp-contact.entity';
import { sanitizeTemplateParam } from '../../whatsapp/domain/template-params';

export type TicketWhatsAppTemplate = 'ticket_listo' | 'resena_google';
export const TICKET_WHATSAPP_TEMPLATES: readonly TicketWhatsAppTemplate[] = [
  'ticket_listo',
  'resena_google',
];

export type TicketWhatsAppErrorCode =
  | 'ticket_not_found'
  | 'invalid_state'
  | 'already_sent'
  | 'marketing_not_allowed'
  | 'invalid_phone'
  | 'whatsapp_send_failed'
  | 'whatsapp_not_configured';

/** Framework-free failure; the controller maps `code` to an HTTP status. */
export class TicketWhatsAppError extends Error {
  constructor(
    readonly code: TicketWhatsAppErrorCode,
    /** Provider message, only for `whatsapp_send_failed`. */
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'TicketWhatsAppError';
  }
}

export type MarketingDeniedReason = 'no_client' | 'no_consent' | 'opted_out';

export interface TicketWhatsAppStatus {
  items: WhatsAppMessage[];
  window: { open: boolean; lastInboundAt: Date | null };
  marketing: { allowed: boolean; reason?: MarketingDeniedReason };
}

export interface SendTicketWhatsAppOptions {
  force?: boolean;
  trigger: 'manual' | 'auto';
  user?: { usuarioId?: string; usuarioEmail?: string };
}

const LANGUAGE_CODE = 'es';
/** Position of the "Ver detalle" URL button in the `ticket_listo` template. */
const TICKET_LISTO_URL_BUTTON_INDEX = 1;

@Injectable()
export class TicketWhatsAppService {
  private readonly logger = new Logger(TicketWhatsAppService.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Inject(WHATSAPP_SENDER)
    private readonly sender: WhatsAppSender,
    @Inject(WHATSAPP_MESSAGE_REPOSITORY)
    private readonly messages: WhatsAppMessageRepository,
    @Inject(WHATSAPP_CONTACT_REPOSITORY)
    private readonly contacts: WhatsAppContactRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
    private readonly config: ConfigService,
  ) {}

  /** `WHATSAPP_AUTO_TICKET_LISTO=true` turns on the automatic `listo` notice. */
  isAutoTicketListoEnabled(): boolean {
    return this.config.get<string>('WHATSAPP_AUTO_TICKET_LISTO') === 'true';
  }

  async getStatus(ticketId: string): Promise<TicketWhatsAppStatus> {
    const ticket = await this.loadTicket(ticketId);
    const phone = this.tryPhone(ticket);
    const contact = phone ? await this.contacts.findByPhone(phone) : null;
    const client = await this.findClient(ticket, phone);
    const items = await this.messages.listByTicket(ticketId);

    return {
      items,
      window: {
        open: isServiceWindowOpen(contact?.lastInboundAt),
        lastInboundAt: contact?.lastInboundAt ?? null,
      },
      marketing: this.evaluateMarketing(client, contact?.marketingOptOutAt),
    };
  }

  async send(
    ticketId: string,
    template: TicketWhatsAppTemplate,
    options: SendTicketWhatsAppOptions,
  ): Promise<WhatsAppMessage> {
    const ticket = await this.loadTicket(ticketId);

    const requiredState =
      template === 'ticket_listo' ? TicketStatus.LISTO : TicketStatus.ENTREGADO;
    if (ticket.estado !== requiredState) {
      throw new TicketWhatsAppError('invalid_state');
    }

    const to = this.tryPhone(ticket);
    if (!to) {
      throw new TicketWhatsAppError('invalid_phone');
    }

    const contact = await this.contacts.findByPhone(to);
    const client = await this.findClient(ticket, to);

    if (template === 'resena_google') {
      const marketing = this.evaluateMarketing(
        client,
        contact?.marketingOptOutAt,
      );
      if (!marketing.allowed) {
        throw new TicketWhatsAppError('marketing_not_allowed');
      }
    }

    if (!options.force) {
      const previous = await this.messages.findLatestByTicketAndTemplate(
        ticketId,
        template,
        { excludeFailed: true },
      );
      if (previous) {
        throw new TicketWhatsAppError('already_sent');
      }
    }

    const input = this.buildInput(ticket, template, to);
    const now = new Date();
    const base = {
      ticketId,
      clientId: client?.id ?? ticket.cliente.clienteId,
      template,
      to,
      insideServiceWindow: isServiceWindowOpen(contact?.lastInboundAt, now),
      trigger: options.trigger,
      sentById: options.user?.usuarioId,
      sentByEmail: options.user?.usuarioEmail,
      sentAt: now,
      statusAt: now,
    };

    try {
      const { wamid } = await this.sender.sendTemplate(input);
      return await this.messages.create({ ...base, wamid, status: 'sent' });
    } catch (error) {
      if (error instanceof WhatsAppNotConfiguredError) {
        throw new TicketWhatsAppError('whatsapp_not_configured');
      }
      if (error instanceof WhatsAppSendError) {
        this.logger.warn(
          `WhatsApp ${template} for ticket ${ticket.codigo} failed: ${error.message}`,
        );
        await this.messages.create({
          ...base,
          status: 'failed',
          error: {
            code: error.code,
            title: error.title,
            message: error.message,
          },
        });
        throw new TicketWhatsAppError(
          'whatsapp_send_failed',
          error.title ? `${error.title}: ${error.message}` : error.message,
        );
      }
      throw error;
    }
  }

  private buildInput(
    ticket: Ticket,
    template: TicketWhatsAppTemplate,
    to: string,
  ): SendTemplateInput {
    const firstName = ticket.cliente.nombre?.trim().split(/\s+/)[0];
    const nombre = sanitizeTemplateParam(firstName, 'cliente');

    if (template === 'resena_google') {
      return {
        to,
        template,
        languageCode: LANGUAGE_CODE,
        bodyParams: [nombre],
      };
    }

    const device = [ticket.equipo.marca, ticket.equipo.modelo]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');
    return {
      to,
      template,
      languageCode: LANGUAGE_CODE,
      bodyParams: [
        nombre,
        sanitizeTemplateParam(device, 'equipo'),
        sanitizeTemplateParam(ticket.codigo),
      ],
      urlButton: {
        index: TICKET_LISTO_URL_BUTTON_INDEX,
        param: ticket.publicToken,
      },
    };
  }

  private evaluateMarketing(
    client: Client | null,
    optedOutAt: Date | undefined,
  ): { allowed: boolean; reason?: MarketingDeniedReason } {
    if (optedOutAt) return { allowed: false, reason: 'opted_out' };
    if (!client) return { allowed: false, reason: 'no_client' };
    if (client.marketingConsent !== true) {
      return { allowed: false, reason: 'no_consent' };
    }
    return { allowed: true };
  }

  /** Client by the ticket's `clienteId`, falling back to the phone number. */
  private async findClient(
    ticket: Ticket,
    phone: string | null,
  ): Promise<Client | null> {
    if (ticket.cliente.clienteId) {
      const byId = await this.clients.findById(ticket.cliente.clienteId);
      if (byId) return byId;
    }
    return phone ? this.clients.findByPhone(phone) : null;
  }

  private tryPhone(ticket: Ticket): string | null {
    try {
      return PhoneNumber.of(ticket.cliente.telefono).toE164();
    } catch {
      return null;
    }
  }

  private async loadTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new TicketWhatsAppError('ticket_not_found');
    return ticket;
  }
}
