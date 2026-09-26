import { Client } from '../../domain/client.entity';
import {
  ClientRepository,
  ClientSearchResult,
  UpdateClientInput,
  UpsertVisitInput,
  UpsertVisitResult,
} from '../../domain/client-repository.port';
import { CommunityEvent } from '../../domain/community-event.entity';
import {
  CommunityEventRepository,
  CreateCommunityEventInput,
} from '../../domain/community-event-repository.port';
import { CommunityNotifier } from '../../domain/community-notifier.port';

let seq = 1;
function nextId(): string {
  return String(seq++);
}

export class FakeClientRepository implements ClientRepository {
  clients: Client[] = [];

  async findById(id: string): Promise<Client | null> {
    return this.clients.find((c) => c.id === id) ?? null;
  }

  async findByPhone(phoneE164: string): Promise<Client | null> {
    return this.clients.find((c) => c.phoneE164 === phoneE164) ?? null;
  }

  async upsertVisit(input: UpsertVisitInput): Promise<UpsertVisitResult> {
    const existing = this.clients.find((c) => c.phoneE164 === input.phoneE164);
    if (existing) {
      existing.firstName = input.firstName;
      existing.lastName = input.lastName;
      // Mirrors MongooseClientRepository: never downgrade approved consent,
      // only upgrade declined -> approved (and refresh the consent date).
      if (!existing.marketingConsent && input.marketingConsent) {
        existing.marketingConsent = true;
        existing.consentAt = input.occurredAt;
      }
      return { client: existing, wasNew: false };
    }

    const client: Client = {
      id: nextId(),
      firstName: input.firstName,
      lastName: input.lastName,
      phoneE164: input.phoneE164,
      marketingConsent: input.marketingConsent,
      consentAt: input.occurredAt,
      channel: input.channel,
      visitCount: 0,
      stamps: 0,
      loyaltyCycle: 1,
      rewardsClaimed: 0,
      lastRewardClaimedAt: null,
      firstVisitAt: null,
      lastVisitAt: null,
    };
    this.clients.push(client);
    return { client, wasNew: true };
  }

  async incrementVisit(id: string, occurredAt: Date): Promise<Client | null> {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return null;
    client.visitCount += 1;
    client.stamps = client.stamps < 5 ? client.stamps + 1 : 5;
    client.lastVisitAt = occurredAt;
    if (!client.firstVisitAt) client.firstVisitAt = occurredAt;
    return client;
  }

  async claimReward(id: string, occurredAt: Date): Promise<Client | null> {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return null;
    client.stamps = 0;
    client.loyaltyCycle += 1;
    client.rewardsClaimed += 1;
    client.lastRewardClaimedAt = occurredAt;
    return client;
  }

  async update(id: string, input: UpdateClientInput): Promise<Client | null> {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return null;
    if (input.firstName !== undefined) client.firstName = input.firstName;
    if (input.lastName !== undefined) client.lastName = input.lastName;
    if (input.marketingConsent !== undefined)
      client.marketingConsent = input.marketingConsent;
    return client;
  }

  async search(
    query: string,
    page: number,
    limit: number,
    marketingConsent?: boolean,
  ): Promise<ClientSearchResult> {
    const lower = query.toLowerCase();
    const filtered = this.clients
      .filter(
        (c) =>
          !lower ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(lower) ||
          c.phoneE164.includes(lower),
      )
      .filter(
        (c) =>
          marketingConsent === undefined ||
          c.marketingConsent === marketingConsent,
      );
    const sorted = [...filtered].sort(
      (a, b) =>
        (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0),
    );
    const start = (page - 1) * limit;
    return { items: sorted.slice(start, start + limit), total: sorted.length };
  }
}

export class FakeCommunityEventRepository implements CommunityEventRepository {
  events: CommunityEvent[] = [];

  async create(input: CreateCommunityEventInput): Promise<CommunityEvent> {
    const event: CommunityEvent = { id: nextId(), ...input };
    this.events.push(event);
    return event;
  }

  async findByClient(clientId: string): Promise<CommunityEvent[]> {
    return [...this.events]
      .filter((e) => e.clientId === clientId)
      .reverse()
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async findByRange(
    from: Date | null,
    to: Date | null,
    type: string | null,
  ): Promise<CommunityEvent[]> {
    return [...this.events]
      .filter((e) => !from || e.occurredAt >= from)
      .filter((e) => !to || e.occurredAt <= to)
      .filter((e) => !type || e.type === type)
      .reverse()
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }
}

export class FakeCommunityNotifier implements CommunityNotifier {
  calls: { client: Client; isNewClient: boolean }[] = [];
  thresholdCalls: { client: Client; threshold: number }[] = [];
  messageCalls: { client: Client; template: string }[] = [];

  async notifyRegistered(client: Client, isNewClient: boolean): Promise<void> {
    this.calls.push({ client, isNewClient });
  }

  async notifyVisitThreshold(client: Client, threshold: number): Promise<void> {
    this.thresholdCalls.push({ client, threshold });
  }

  async notifyDirectMessage(
    client: Client,
    template: 'promo_20' | 'google_review' | 'reconnect',
  ): Promise<{ sent: boolean; message?: string }> {
    this.messageCalls.push({ client, template });
    return { sent: true, message: `Sample message for ${template}` };
  }
}
