import { RegisterClientUseCase } from './register-client.use-case';
import {
  FakeClientRepository,
  FakeCommunityEventRepository,
  FakeCommunityNotifier,
} from './__tests__/fakes';
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
    expect(result.client.visitCount).toBe(0);
    expect(result.client.stamps).toBe(0);
    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe('registro');
    expect(notifier.calls).toHaveLength(1);
  });

  it('keeps visit count at 0 on repeat submission (only technician registers visits)', async () => {
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
    expect(second.client.visitCount).toBe(0);
    expect(clients.clients).toHaveLength(1);
    expect(events.events.map((e) => e.type)).toEqual(['registro', 'registro']);
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

  it('registers a client who declines marketing consent (2026-09-25: consent is optional)', async () => {
    const result = await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '965728013',
      marketingConsent: false,
      channel: 'qr',
    });

    expect(result.isNewClient).toBe(true);
    expect(result.client.marketingConsent).toBe(false);
    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe('registro');
    expect(clients.clients).toHaveLength(1);
  });

  it('upgrades a declined consent to approved on repeat submission', async () => {
    await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '965728013',
      marketingConsent: false,
      channel: 'qr',
    });

    const second = await useCase.execute({
      firstName: 'Juana',
      lastName: 'Perez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });

    expect(second.client.marketingConsent).toBe(true);
  });

  it('never downgrades an already-approved consent on repeat submission', async () => {
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
      phone: '965728013',
      marketingConsent: false,
      channel: 'qr',
    });

    expect(second.client.marketingConsent).toBe(true);
  });
});
