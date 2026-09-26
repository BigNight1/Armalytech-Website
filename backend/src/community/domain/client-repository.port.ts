import { Client, CommunityChannel } from './client.entity';

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');

export interface UpsertVisitInput {
  firstName: string;
  lastName: string;
  phoneE164: string;
  marketingConsent: boolean;
  channel: CommunityChannel;
  occurredAt: Date;
}

export interface UpsertVisitResult {
  client: Client;
  wasNew: boolean;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  marketingConsent?: boolean;
}

export interface ClientSearchResult {
  items: Client[];
  total: number;
}

export interface ClientRepository {
  findById(id: string): Promise<Client | null>;
  findByPhone(phoneE164: string): Promise<Client | null>;
  /**
   * Atomically creates the client on first registration with 0 visits,
   * or updates info on duplicate registration.
   */
  upsertVisit(input: UpsertVisitInput): Promise<UpsertVisitResult>;
  update(id: string, input: UpdateClientInput): Promise<Client | null>;
  incrementVisit(id: string, occurredAt: Date): Promise<Client | null>;
  claimReward(id: string, occurredAt: Date): Promise<Client | null>;
  search(
    query: string,
    page: number,
    limit: number,
    marketingConsent?: boolean,
  ): Promise<ClientSearchResult>;
}
