import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
  UpdateClientInput,
} from '../domain/client-repository.port';
import { ClientNotFoundError } from '../domain/community.errors';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
  ) {}

  async execute(id: string, input: UpdateClientInput): Promise<Client> {
    const updated = await this.clients.update(id, {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      marketingConsent: input.marketingConsent,
    });
    if (!updated) {
      throw new ClientNotFoundError(id);
    }
    return updated;
  }
}
