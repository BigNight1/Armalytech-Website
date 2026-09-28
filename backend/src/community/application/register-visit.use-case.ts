import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../domain/client-repository.port';
import {
  CommunityEventRepository,
  COMMUNITY_EVENT_REPOSITORY,
} from '../domain/community-event-repository.port';
import {
  CommunityNotifier,
  COMMUNITY_NOTIFIER,
} from '../domain/community-notifier.port';
import { PhoneNumber } from '../domain/phone-number.vo';
import { ClientNotFoundError } from '../domain/community.errors';
import { ValidationDomainError } from '../../shared/domain/domain-error';
import { Client } from '../domain/client.entity';
import { RealtimePublisher } from '../../shared/realtime/realtime-publisher';

export interface RegisterVisitInput {
  clientId?: string;
  phone?: string;
}

export interface RegisterVisitResult {
  client: Client;
  thresholdReached: boolean;
  rewardReady: boolean;
}

@Injectable()
export class RegisterVisitUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
    @Inject(COMMUNITY_NOTIFIER) private readonly notifier: CommunityNotifier,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(input: RegisterVisitInput): Promise<RegisterVisitResult> {
    const occurredAt = new Date();
    let client: Client | null = null;

    if (input.clientId) {
      client = await this.clients.findById(input.clientId);
    } else if (input.phone) {
      const phoneVo = PhoneNumber.of(input.phone);
      client = await this.clients.findByPhone(phoneVo.toE164());
    } else {
      throw new ValidationDomainError(
        'Either clientId or phone must be provided',
      );
    }

    if (!client) {
      throw new ClientNotFoundError(input.clientId || input.phone || '');
    }

    const updated = await this.clients.incrementVisit(client.id, occurredAt);
    if (!updated) {
      throw new ClientNotFoundError(client.id);
    }

    await this.events.create({
      clientId: updated.id,
      phoneE164: updated.phoneE164,
      type: 'visita',
      rejectReason: null,
      channel: 'manual',
      occurredAt,
    });

    const thresholdReached = updated.stamps === 4;
    const rewardReady = updated.stamps >= 5;

    if (thresholdReached && updated.marketingConsent) {
      await this.notifier.notifyVisitThreshold(updated, 4);
    }

    this.realtime?.publish('clients');

    return {
      client: updated,
      thresholdReached,
      rewardReady,
    };
  }
}
