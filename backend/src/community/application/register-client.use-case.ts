import { Inject, Injectable } from '@nestjs/common';
import { PhoneNumber } from '../domain/phone-number.vo';
import { Client, CommunityChannel } from '../domain/client.entity';
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
import { MarketingConsentRequiredError } from '../domain/community.errors';
import { ValidationDomainError } from '../../shared/domain/domain-error';

export interface RegisterClientInput {
  firstName: string;
  lastName: string;
  phone: string;
  marketingConsent: boolean;
  channel: CommunityChannel;
}

export interface RegisterClientResult {
  client: Client;
  isNewClient: boolean;
}

/**
 * Public registration use case (ADR 0012-0015): a repeat submission of an
 * already-known phone number counts as a visit, not a new client (ADR 0013).
 * Every outcome — new registration, repeat visit, or rejection — is recorded
 * as a `CommunityEvent` (ADR 0018).
 */
@Injectable()
export class RegisterClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
    @Inject(COMMUNITY_NOTIFIER) private readonly notifier: CommunityNotifier,
  ) {}

  async execute(input: RegisterClientInput): Promise<RegisterClientResult> {
    const occurredAt = new Date();

    let phoneNumber: PhoneNumber;
    try {
      phoneNumber = PhoneNumber.of(input.phone);
    } catch (error) {
      await this.events.create({
        clientId: null,
        phoneE164: (input.phone ?? '').trim(),
        type: 'registro_rechazado',
        rejectReason: 'numero_invalido',
        channel: input.channel,
        occurredAt,
      });
      throw error;
    }

    if (input.marketingConsent !== true) {
      await this.events.create({
        clientId: null,
        phoneE164: phoneNumber.toE164(),
        type: 'registro_rechazado',
        rejectReason: 'sin_consentimiento',
        channel: input.channel,
        occurredAt,
      });
      throw new MarketingConsentRequiredError();
    }

    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new ValidationDomainError('First and last name are required');
    }

    const { client, wasNew } = await this.clients.upsertVisit({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneE164: phoneNumber.toE164(),
      marketingConsent: true,
      channel: input.channel,
      occurredAt,
    });

    await this.events.create({
      clientId: client.id,
      phoneE164: client.phoneE164,
      type: 'registro',
      rejectReason: null,
      channel: input.channel,
      occurredAt,
    });

    await this.notifier.notifyRegistered(client, wasNew);

    return { client, isNewClient: wasNew };
  }
}
