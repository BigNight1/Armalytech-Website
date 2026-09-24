import { RegisterVisitUseCase } from '../register-visit.use-case';
import { ClaimRewardUseCase } from '../claim-reward.use-case';
import { SendCommunityMessageUseCase } from '../send-community-message.use-case';
import {
  FakeClientRepository,
  FakeCommunityEventRepository,
  FakeCommunityNotifier,
} from './fakes';
import { ValidationDomainError } from '../../../shared/domain/domain-error';
import { MarketingConsentRequiredError } from '../../domain/community.errors';

describe('Community Loyalty & Messaging Use Cases', () => {
  let clients: FakeClientRepository;
  let events: FakeCommunityEventRepository;
  let notifier: FakeCommunityNotifier;
  let registerVisit: RegisterVisitUseCase;
  let claimReward: ClaimRewardUseCase;
  let sendMessage: SendCommunityMessageUseCase;

  beforeEach(async () => {
    clients = new FakeClientRepository();
    events = new FakeCommunityEventRepository();
    notifier = new FakeCommunityNotifier();
    registerVisit = new RegisterVisitUseCase(clients, events, notifier);
    claimReward = new ClaimRewardUseCase(clients, events);
    sendMessage = new SendCommunityMessageUseCase(clients, events, notifier);

    // Seed a client with 0 visits
    await clients.upsertVisit({
      firstName: 'Edu',
      lastName: 'Armas',
      phoneE164: '51965728013',
      marketingConsent: true,
      channel: 'qr',
      occurredAt: new Date(),
    });
  });

  it('increments visit count and stamps sequentially on manual registration', async () => {
    const client = await clients.findByPhone('51965728013');
    expect(client).toBeDefined();

    // 1st visit
    const v1 = await registerVisit.execute({ clientId: client!.id });
    expect(v1.client.visitCount).toBe(1);
    expect(v1.client.stamps).toBe(1);
    expect(v1.thresholdReached).toBe(false);
    expect(v1.rewardReady).toBe(false);

    // 2nd visit
    const v2 = await registerVisit.execute({ clientId: client!.id });
    expect(v2.client.visitCount).toBe(2);
    expect(v2.client.stamps).toBe(2);

    // 3rd visit
    const v3 = await registerVisit.execute({ clientId: client!.id });
    expect(v3.client.visitCount).toBe(3);
    expect(v3.client.stamps).toBe(3);

    // 4th visit -> triggers n8n webhook notification
    const v4 = await registerVisit.execute({ clientId: client!.id });
    expect(v4.client.visitCount).toBe(4);
    expect(v4.client.stamps).toBe(4);
    expect(v4.thresholdReached).toBe(true);
    expect(v4.rewardReady).toBe(false);
    expect(notifier.thresholdCalls).toHaveLength(1);
    expect(notifier.thresholdCalls[0].threshold).toBe(4);

    // 5th visit -> unlocks reward
    const v5 = await registerVisit.execute({ clientId: client!.id });
    expect(v5.client.visitCount).toBe(5);
    expect(v5.client.stamps).toBe(5);
    expect(v5.rewardReady).toBe(true);
  });

  it('allows registering a visit by phone number', async () => {
    const res = await registerVisit.execute({ phone: '965 728 013' });
    expect(res.client.visitCount).toBe(1);
    expect(res.client.stamps).toBe(1);
  });

  it('redeems the 20% discount when reaching 5 stamps and resets cycle', async () => {
    const client = await clients.findByPhone('51965728013');
    for (let i = 0; i < 5; i++) {
      await registerVisit.execute({ clientId: client!.id });
    }

    const updated = await claimReward.execute(client!.id);
    expect(updated.stamps).toBe(0);
    expect(updated.visitCount).toBe(5);
    expect(updated.rewardsClaimed).toBe(1);
    expect(updated.loyaltyCycle).toBe(2);
    expect(updated.lastRewardClaimedAt).toBeDefined();

    const claimEvents = events.events.filter((e) => e.type === 'premio_canjeado');
    expect(claimEvents).toHaveLength(1);
  });

  it('prevents claiming reward before 5 stamps', async () => {
    const client = await clients.findByPhone('51965728013');
    await registerVisit.execute({ clientId: client!.id }); // 1 stamp

    await expect(claimReward.execute(client!.id)).rejects.toThrow(
      ValidationDomainError,
    );
  });

  it('sends direct messages when client has marketing consent', async () => {
    const client = await clients.findByPhone('51965728013');
    const res = await sendMessage.execute({
      clientId: client!.id,
      template: 'google_review',
    });

    expect(res.ok).toBe(true);
    expect(res.sent).toBe(true);
    expect(notifier.messageCalls).toHaveLength(1);
    expect(notifier.messageCalls[0].template).toBe('google_review');
  });

  it('rejects sending direct messages if client declined marketing consent', async () => {
    const client = await clients.findByPhone('51965728013');
    client!.marketingConsent = false;

    await expect(
      sendMessage.execute({
        clientId: client!.id,
        template: 'promo_20',
      }),
    ).rejects.toThrow(MarketingConsentRequiredError);
  });
});
