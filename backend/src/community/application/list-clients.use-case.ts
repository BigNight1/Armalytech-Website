import { Inject, Injectable } from '@nestjs/common';
import {
  ClientRepository,
  ClientSearchResult,
  CLIENT_REPOSITORY,
} from '../domain/client-repository.port';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepository,
  ) {}

  async execute(
    query: string,
    page: number,
    limit: number,
    marketingConsent?: boolean,
  ): Promise<ClientSearchResult> {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));
    return this.clients.search(
      query?.trim() ?? '',
      safePage,
      safeLimit,
      marketingConsent,
    );
  }
}
