export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppTrigger = 'manual' | 'auto';

export interface WhatsAppMessageError {
  code?: string;
  title?: string;
  message: string;
}

export interface WhatsAppMessage {
  id: string;
  ticketId?: string;
  clientId?: string;
  template: string;
  /** Destination in E.164 without the leading `+`. */
  to: string;
  wamid?: string;
  status: WhatsAppMessageStatus;
  error?: WhatsAppMessageError;
  /** True when the customer's last inbound message was under 24 h old. */
  insideServiceWindow: boolean;
  trigger: WhatsAppTrigger;
  sentById?: string;
  sentByEmail?: string;
  sentAt: Date;
  statusAt: Date;
  createdAt: Date;
}

export const WHATSAPP_MESSAGE_STATUSES: readonly WhatsAppMessageStatus[] = [
  'sent',
  'delivered',
  'read',
  'failed',
];

const STATUS_RANK: Record<'sent' | 'delivered' | 'read', number> = {
  sent: 1,
  delivered: 2,
  read: 3,
};

/**
 * Delivery statuses only move forward (sent < delivered < read); `failed`
 * always applies, but a failed message never moves again to a later status
 * (provider callbacks can arrive out of order).
 */
export function shouldApplyStatus(
  current: WhatsAppMessageStatus,
  next: WhatsAppMessageStatus,
): boolean {
  if (next === 'failed') return true;
  if (current === 'failed') return false;
  return STATUS_RANK[next] > STATUS_RANK[current];
}

/** Statuses that a message can currently have for `next` to be applied to it. */
export function statusesReplaceableBy(
  next: WhatsAppMessageStatus,
): WhatsAppMessageStatus[] {
  return WHATSAPP_MESSAGE_STATUSES.filter((current) =>
    shouldApplyStatus(current, next),
  ) as WhatsAppMessageStatus[];
}
