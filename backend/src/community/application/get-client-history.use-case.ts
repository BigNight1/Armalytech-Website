import { Inject, Injectable } from '@nestjs/common';
import { CommunityEvent } from '../domain/community-event.entity';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../domain/client-repository.port';
import {
  CommunityEventRepository,
  COMMUNITY_EVENT_REPOSITORY,
} from '../domain/community-event-repository.port';
import { ClientNotFoundError } from '../domain/community.errors';

@Injectable()
export class GetClientHistoryUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
    @Inject(COMMUNITY_EVENT_REPOSITORY)
    private readonly events: CommunityEventRepository,
  ) {}

  async execute(clientId: string): Promise<CommunityEvent[]> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }
    return this.events.findByClient(clientId);
  }
}
