import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../domain/client-repository.port';
import {
  CommunityEventRepository,
  COMMUNITY_EVENT_REPOSITORY,
} from '../domain/community-event-repository.port';
import { ClientNotFoundError } from '../domain/community.errors';
import { ValidationDomainError } from '../../shared/domain/domain-error';
import { Client } from '../domain/client.entity';
import { RealtimePublisher } from '../../shared/realtime/realtime-publisher';

@Injectable()
export class ClaimRewardUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(clientId: string): Promise<Client> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }

    if (client.stamps < 5) {
      throw new ValidationDomainError(
        `Client only has ${client.stamps} of 5 stamps. 5 stamps required to claim the 20% discount.`,
      );
    }

    const occurredAt = new Date();
    const updated = await this.clients.claimReward(clientId, occurredAt);
    if (!updated) {
      throw new ClientNotFoundError(clientId);
    }

    await this.events.create({
      clientId: updated.id,
      phoneE164: updated.phoneE164,
      type: 'premio_canjeado',
      rejectReason: null,
      channel: 'manual',
      occurredAt,
    });

    this.realtime?.publish('clients');

    return updated;
  }
}
