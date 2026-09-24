import { Inject, Injectable } from '@nestjs/common';
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
import {
  ClientNotFoundError,
  MarketingConsentRequiredError,
} from '../domain/community.errors';
import { ValidationDomainError } from '../../shared/domain/domain-error';

export type CommunityMessageTemplate = 'promo_20' | 'google_review' | 'reconnect';

export interface SendCommunityMessageInput {
  clientId: string;
  template: CommunityMessageTemplate;
}

export interface SendCommunityMessageResult {
  ok: boolean;
  sent: boolean;
  message?: string;
  phoneE164: string;
}

@Injectable()
export class SendCommunityMessageUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
    @Inject(COMMUNITY_NOTIFIER) private readonly notifier: CommunityNotifier,
  ) {}

  async execute(input: SendCommunityMessageInput): Promise<SendCommunityMessageResult> {
    const validTemplates = ['promo_20', 'google_review', 'reconnect'];
    if (!validTemplates.includes(input.template)) {
      throw new ValidationDomainError(`Invalid message template: ${input.template}`);
    }

    const client = await this.clients.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    if (!client.marketingConsent) {
      throw new MarketingConsentRequiredError();
    }

    const result = await this.notifier.notifyDirectMessage(client, input.template);
    const occurredAt = new Date();

    await this.events.create({
      clientId: client.id,
      phoneE164: client.phoneE164,
      type: 'mensaje_enviado',
      rejectReason: input.template,
      channel: 'manual',
      occurredAt,
    });

    return {
      ok: true,
      sent: result.sent,
      message: result.message,
      phoneE164: client.phoneE164,
    };
  }
}
