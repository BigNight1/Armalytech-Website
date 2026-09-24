import { CommunityChannel } from './client.entity';

/**
 * Event taxonomy per ADR 0018. Kept as the exact Spanish literals the ADR
 * defines (they are stored business vocabulary, not UI copy or identifiers).
 */
export type CommunityEventType = 'registro' | 'visita' | 'registro_rechazado';

export interface CommunityEvent {
  id: string;
  /** Null when the event is a rejected registration with no matching client. */
  clientId: string | null;
  phoneE164: string;
  type: CommunityEventType;
  rejectReason: string | null;
  occurredAt: Date;
  channel: CommunityChannel;
}
