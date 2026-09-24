export type CommunityChannel = 'qr' | 'nfc' | 'manual';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  marketingConsent: boolean;
  consentAt: Date;
  /** Channel of the client's first registration; never changes afterwards. */
  channel: CommunityChannel;
  visitCount: number;
  /** Loyalty stamps in the current 5-visit cycle (0 to 5) */
  stamps: number;
  /** Number of loyalty cycles completed or active */
  loyaltyCycle: number;
  /** Total rewards claimed */
  rewardsClaimed: number;
  lastRewardClaimedAt?: Date | null;
  firstVisitAt?: Date | null;
  lastVisitAt?: Date | null;
}

