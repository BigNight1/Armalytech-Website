import { RegisterClientUseCase } from './register-client.use-case';
import {
  FakeClientRepository,
  FakeCommunityEventRepository,
  FakeCommunityNotifier,
} from './__tests__/fakes';
import { MarketingConsentRequiredError } from '../domain/community.errors';
import { ValidationDomainError } from '../../shared/domain/domain-error';

describe('RegisterClientUseCase', () => {
  let clients: FakeClientRepository;
  let events: FakeCommunityEventRepository;
  let notifier: FakeCommunityNotifier;
  let useCase: RegisterClientUseCase;

  beforeEach(() => {
    clients = new FakeClientRepository();
    events = new FakeCommunityEventRepository();
    notifier = new FakeCommunityNotifier();
    useCase = new RegisterClientUseCase(clients, events, notifier);
  });

  it('creates a new client and a "registro" event on first submission', async () => {
    const result = await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });

    expect(result.isNewClient).toBe(true);
    expect(result.client.phoneE164).toBe('51965728013');
    expect(result.client.visitCount).toBe(1);
    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe('registro');
    expect(notifier.calls).toHaveLength(1);
  });

  it('counts a repeat submission as a visit, not a new client', async () => {
    await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });

    const second = await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '+51 965 728 013',
      marketingConsent: true,
      channel: 'nfc',
    });

    expect(second.isNewClient).toBe(false);
    expect(second.client.visitCount).toBe(2);
    expect(clients.clients).toHaveLength(1);
    expect(events.events.map((e) => e.type)).toEqual(['registro', 'visita']);
  });

  it('rejects and logs an invalid phone number', async () => {
    await expect(
      useCase.execute({
        firstName: 'Juana',
        lastName: 'Perez',
        phone: '123456789',
        marketingConsent: true,
        channel: 'qr',
      }),
    ).rejects.toThrow(ValidationDomainError);

    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe('registro_rechazado');
    expect(events.events[0].rejectReason).toBe('numero_invalido');
    expect(clients.clients).toHaveLength(0);
  });

  it('rejects and logs a submission without marketing consent', async () => {
    await expect(
      useCase.execute({
        firstName: 'Juana',
        lastName: 'Perez',
        phone: '965728013',
        marketingConsent: false,
        channel: 'qr',
      }),
    ).rejects.toThrow(MarketingConsentRequiredError);

    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe('registro_rechazado');
    expect(events.events[0].rejectReason).toBe('sin_consentimiento');
    expect(clients.clients).toHaveLength(0);
  });
});
