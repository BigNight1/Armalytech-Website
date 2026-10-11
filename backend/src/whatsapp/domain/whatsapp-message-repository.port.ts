import {
  WhatsAppMessage,
  WhatsAppMessageError,
  WhatsAppMessageStatus,
} from './whatsapp-message.entity';

export const WHATSAPP_MESSAGE_REPOSITORY = Symbol(
  'WHATSAPP_MESSAGE_REPOSITORY',
);

export type CreateWhatsAppMessageInput = Omit<
  WhatsAppMessage,
  'id' | 'createdAt'
>;

export interface UpdateWhatsAppMessageStatusInput {
  status: WhatsAppMessageStatus;
  statusAt: Date;
  error?: WhatsAppMessageError;
}

export interface WhatsAppMessageRepository {
  create(input: CreateWhatsAppMessageInput): Promise<WhatsAppMessage>;
  findByWamid(wamid: string): Promise<WhatsAppMessage | null>;
  /** Newest first (`sentAt` desc). */
  listByTicket(ticketId: string): Promise<WhatsAppMessage[]>;
  findLatestByTicketAndTemplate(
    ticketId: string,
    template: string,
    options?: { excludeFailed?: boolean },
  ): Promise<WhatsAppMessage | null>;
  /**
   * Applies a provider status to the message with `wamid`, atomically and
   * only when the transition is allowed (see `shouldApplyStatus`). Returns the
   * updated message, or `null` when it does not exist or the transition was
   * ignored (older or duplicate status).
   */
  updateStatus(
    wamid: string,
    input: UpdateWhatsAppMessageStatusInput,
  ): Promise<WhatsAppMessage | null>;
}
