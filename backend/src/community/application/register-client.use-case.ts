import { Inject, Injectable, Optional } from '@nestjs/common';
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
import { ValidationDomainError } from '../../shared/domain/domain-error';
import { RealtimePublisher } from '../../shared/realtime/realtime-publisher';

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
 * Public registration use case (ADR 0012-0015, updated 2026-09-25): marketing
 * consent is optional — a decline no longer rejects the registration, it just
 * registers (or recognizes) the client with `marketingConsent: false`. A
 * repeat submission of an already-known phone number counts as a visit, not a
 * new client (ADR 0013), and never downgrades a previously-approved consent
 * (`ClientRepository.upsertVisit` owns that rule). Every outcome — new
 * registration or repeat registration — is recorded as a `CommunityEvent`
 * (ADR 0018); an invalid phone number is still rejected and logged.
 */
@Injectable()
export class RegisterClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
    @Inject(COMMUNITY_NOTIFIER) private readonly notifier: CommunityNotifier,
    @Optional() private readonly realtime?: RealtimePublisher,
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

    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new ValidationDomainError('First and last name are required');
    }

    const { client, wasNew } = await this.clients.upsertVisit({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneE164: phoneNumber.toE164(),
      marketingConsent: input.marketingConsent === true,
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

    this.realtime?.publish('clients', 'client_registered');

    return { client, isNewClient: wasNew };
  }
}
