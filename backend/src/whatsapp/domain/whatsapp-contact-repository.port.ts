import { WhatsAppContact } from './whatsapp-contact.entity';

export const WHATSAPP_CONTACT_REPOSITORY = Symbol(
  'WHATSAPP_CONTACT_REPOSITORY',
);

export interface WhatsAppContactRepository {
  findByPhone(phoneE164: string): Promise<WhatsAppContact | null>;
  /** Upserts the contact; `lastInboundAt` never moves backwards. */
  touchInbound(phoneE164: string, at: Date): Promise<void>;
  /** Upserts the contact with `marketingOptOutAt = at`. */
  markOptOut(phoneE164: string, at: Date): Promise<void>;
}
