import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from '../../community/domain/client-repository.port';
import { PhoneNumber } from '../../community/domain/phone-number.vo';
import {
  WHATSAPP_CONTACT_REPOSITORY,
  WhatsAppContactRepository,
} from '../domain/whatsapp-contact-repository.port';
import {
  WHATSAPP_MESSAGE_REPOSITORY,
  WhatsAppMessageRepository,
} from '../domain/whatsapp-message-repository.port';
import {
  WhatsAppMessageError,
  WhatsAppMessageStatus,
} from '../domain/whatsapp-message.entity';

const RECEIVED_EVENT = 'whatsapp.message.received';

const STATUS_EVENTS: Record<string, WhatsAppMessageStatus> = {
  'whatsapp.message.sent': 'sent',
  'whatsapp.message.delivered': 'delivered',
  'whatsapp.message.read': 'read',
  'whatsapp.message.failed': 'failed',
};

/** Normalized replies that mean "stop sending me promotions". */
const OPT_OUT_PHRASES = new Set(['dejar de recibir promociones', 'baja']);

type Json = Record<string, unknown>;

/**
 * Applies one Kapso webhook payload (ADR 0029): inbound messages open the
 * 24 h window and can opt the customer out of marketing; status events
 * update the delivery state of messages we sent. Payloads come from outside,
 * so every field is parsed defensively and unknown events are ignored.
 */
@Injectable()
export class HandleKapsoWebhookUseCase {
  private readonly logger = new Logger(HandleKapsoWebhookUseCase.name);

  constructor(
    @Inject(WHATSAPP_MESSAGE_REPOSITORY)
    private readonly messages: WhatsAppMessageRepository,
    @Inject(WHATSAPP_CONTACT_REPOSITORY)
    private readonly contacts: WhatsAppContactRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
  ) {}

  async execute(event: string | undefined, payload: unknown): Promise<void> {
    const root = asObject(payload);
    if (!root || !event) return;

    if (event === RECEIVED_EVENT) {
      await this.handleReceived(root);
      return;
    }
    const status = STATUS_EVENTS[event];
    if (status) {
      await this.handleStatus(status, root);
    }
  }

  private async handleReceived(root: Json): Promise<void> {
    const message = asObject(root.message);
    const conversation = asObject(root.conversation);
    const phone = normalizePhone(
      asString(message?.from) ?? asString(conversation?.phone_number),
    );
    if (!phone) return;

    const at = parseEpochSeconds(message?.timestamp) ?? new Date();
    await this.contacts.touchInbound(phone, at);

    if (message && isOptOutMessage(message)) {
      await this.contacts.markOptOut(phone, at);
      const client = await this.clients.findByPhone(phone);
      if (client && client.marketingConsent) {
        await this.clients.update(client.id, { marketingConsent: false });
      }
      this.logger.log(`Marketing opt-out recorded for ${maskPhone(phone)}`);
    }
  }

  private async handleStatus(
    status: WhatsAppMessageStatus,
    root: Json,
  ): Promise<void> {
    const message = asObject(root.message);
    const wamid = asString(message?.id);
    if (!wamid) return;

    const statuses = asArray(asObject(message?.kapso)?.statuses);
    const last = asObject(statuses[statuses.length - 1]);
    const statusAt =
      parseEpochSeconds(last?.timestamp) ??
      parseEpochSeconds(message?.timestamp) ??
      new Date();

    await this.messages.updateStatus(wamid, {
      status,
      statusAt,
      error: status === 'failed' ? extractError(last) : undefined,
    });
  }
}

function isOptOutMessage(message: Json): boolean {
  const button = asObject(message.button);
  const reply = asObject(asObject(message.interactive)?.button_reply);
  const text = asObject(message.text);
  const candidates = [
    button?.text,
    button?.payload,
    reply?.title,
    reply?.id,
    text?.body,
  ];
  return candidates.some((value) => {
    const normalized = normalizeText(value);
    return normalized !== undefined && OPT_OUT_PHRASES.has(normalized);
  });
}

/** Lowercase, accent-insensitive, punctuation-free, single-spaced. */
function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || undefined;
}

function extractError(
  status: Json | undefined,
): WhatsAppMessageError | undefined {
  const first = asObject(asArray(status?.errors)[0]);
  const code = first?.code;
  const title = asString(first?.title);
  const message = asString(first?.message) ?? title;
  if (!first || !message) return { message: 'Delivery failed' };
  return {
    code: code !== undefined && code !== null ? String(code) : undefined,
    title,
    message,
  };
}

function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    return PhoneNumber.of(raw).toE164();
  } catch {
    return undefined;
  }
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

/** Kapso timestamps are Unix epoch seconds, as a string or a number. */
function parseEpochSeconds(value: unknown): Date | undefined {
  const seconds =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value.trim())
        ? Number(value)
        : NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return new Date(seconds * 1000);
}

function asObject(value: unknown): Json | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Json)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
