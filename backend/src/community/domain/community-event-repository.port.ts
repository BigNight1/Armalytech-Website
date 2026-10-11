import { CommunityEvent, CommunityEventType } from './community-event.entity';
import { CommunityChannel } from './client.entity';

export const COMMUNITY_EVENT_REPOSITORY = Symbol('COMMUNITY_EVENT_REPOSITORY');

export interface CreateCommunityEventInput {
  clientId: string | null;
  phoneE164: string;
  type: CommunityEventType;
  rejectReason: string | null;
  channel: CommunityChannel;
  occurredAt: Date;
}

export interface CommunityEventRepository {
  create(input: CreateCommunityEventInput): Promise<CommunityEvent>;
  findByClient(clientId: string): Promise<CommunityEvent[]>;
  findByRange(
    from: Date | null,
    to: Date | null,
    type: CommunityEventType | null,
  ): Promise<CommunityEvent[]>;
}
