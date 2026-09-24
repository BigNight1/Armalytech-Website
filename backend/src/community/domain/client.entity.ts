export type CommunityChannel = 'qr' | 'nfc';

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
  firstVisitAt: Date;
  lastVisitAt: Date;
}
