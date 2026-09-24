import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity';
import {
  ClientRepository,
  CLIENT_REPOSITORY,
} from '../domain/client-repository.port';
import { ClientNotFoundError } from '../domain/community.errors';

@Injectable()
export class GetClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
  ) {}

  async execute(id: string): Promise<Client> {
    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }
    return client;
  }
}
