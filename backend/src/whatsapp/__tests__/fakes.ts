import {
  CreateWhatsAppMessageInput,
  UpdateWhatsAppMessageStatusInput,
  WhatsAppMessageRepository,
} from '../domain/whatsapp-message-repository.port';
import {
  WhatsAppMessage,
  shouldApplyStatus,
} from '../domain/whatsapp-message.entity';
import { WhatsAppContactRepository } from '../domain/whatsapp-contact-repository.port';
import { WhatsAppContact } from '../domain/whatsapp-contact.entity';
import {
  SendTemplateInput,
  SendTemplateResult,
  WhatsAppSender,
} from '../domain/whatsapp-sender.port';

export class FakeWhatsAppSender implements WhatsAppSender {
  calls: SendTemplateInput[] = [];
  /** Set to make the next sends throw this error. */
  failWith?: Error;
  private seq = 0;

  async sendTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
    this.calls.push(input);
    if (this.failWith) throw this.failWith;
    this.seq += 1;
    return { wamid: `wamid.FAKE${this.seq}` };
  }
}

export class FakeWhatsAppMessageRepository implements WhatsAppMessageRepository {
  messages: WhatsAppMessage[] = [];
  private seq = 0;

  async create(input: CreateWhatsAppMessageInput): Promise<WhatsAppMessage> {
    this.seq += 1;
    const message: WhatsAppMessage = {
      ...input,
      id: `msg-${this.seq}`,
      createdAt: input.sentAt,
    };
    this.messages.push(message);
    return message;
  }

  async findByWamid(wamid: string): Promise<WhatsAppMessage | null> {
    return this.messages.find((m) => m.wamid === wamid) ?? null;
  }

  async listByTicket(ticketId: string): Promise<WhatsAppMessage[]> {
    return this.messages
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async findLatestByTicketAndTemplate(
    ticketId: string,
    template: string,
    options?: { excludeFailed?: boolean },
  ): Promise<WhatsAppMessage | null> {
    const matches = this.messages
      .filter((m) => m.ticketId === ticketId && m.template === template)
      .filter((m) => !(options?.excludeFailed && m.status === 'failed'))
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    return matches[0] ?? null;
  }

  async updateStatus(
    wamid: string,
    input: UpdateWhatsAppMessageStatusInput,
  ): Promise<WhatsAppMessage | null> {
    const message = this.messages.find((m) => m.wamid === wamid);
    if (!message || !shouldApplyStatus(message.status, input.status)) {
      return null;
    }
    message.status = input.status;
    message.statusAt = input.statusAt;
    message.error = input.error;
    return message;
  }
}

export class FakeWhatsAppContactRepository implements WhatsAppContactRepository {
  contacts = new Map<string, WhatsAppContact>();

  async findByPhone(phoneE164: string): Promise<WhatsAppContact | null> {
    return this.contacts.get(phoneE164) ?? null;
  }

  async touchInbound(phoneE164: string, at: Date): Promise<void> {
    const current = this.contacts.get(phoneE164);
    const lastInboundAt =
      current?.lastInboundAt && current.lastInboundAt > at
        ? current.lastInboundAt
        : at;
    this.contacts.set(phoneE164, {
      ...current,
      phoneE164,
      lastInboundAt,
      updatedAt: new Date(),
    });
  }

  async markOptOut(phoneE164: string, at: Date): Promise<void> {
    const current = this.contacts.get(phoneE164);
    this.contacts.set(phoneE164, {
      ...current,
      phoneE164,
      marketingOptOutAt: at,
      updatedAt: new Date(),
    });
  }
}
