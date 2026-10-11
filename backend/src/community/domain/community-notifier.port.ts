import { Client } from './client.entity';

export const COMMUNITY_NOTIFIER = Symbol('COMMUNITY_NOTIFIER');

/**
 * Domain-facing port for the messaging integration (n8n / Meta WhatsApp
 * Business Cloud API, ADR 0016/0017), intentionally left without a real
 * adapter: messaging is out of scope for this feature. `NoopCommunityNotifier`
 * (infrastructure) is the only implementation wired today, so a future
 * n8n/Meta adapter can be swapped in behind this port without touching the
 * use case.
 */
export interface CommunityNotifier {
  notifyRegistered(client: Client, isNewClient: boolean): Promise<void>;
  notifyVisitThreshold(client: Client, threshold: number): Promise<void>;
  notifyDirectMessage(
    client: Client,
    template: 'promo_20' | 'google_review' | 'reconnect',
  ): Promise<{ sent: boolean; message?: string }>;
}
