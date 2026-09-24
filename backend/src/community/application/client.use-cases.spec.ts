import { ListClientsUseCase } from './list-clients.use-case';
import { GetClientUseCase } from './get-client.use-case';
import { GetClientHistoryUseCase } from './get-client-history.use-case';
import { ListCommunityEventsUseCase } from './list-community-events.use-case';
import { UpdateClientUseCase } from './update-client.use-case';
import { RegisterClientUseCase } from './register-client.use-case';
import {
  FakeClientRepository,
  FakeCommunityEventRepository,
  FakeCommunityNotifier,
} from './__tests__/fakes';
import { ClientNotFoundError } from '../domain/community.errors';

describe('Client query/admin use cases', () => {
  let clients: FakeClientRepository;
  let events: FakeCommunityEventRepository;
  let register: RegisterClientUseCase;

  beforeEach(() => {
    clients = new FakeClientRepository();
    events = new FakeCommunityEventRepository();
    register = new RegisterClientUseCase(
      clients,
      events,
      new FakeCommunityNotifier(),
    );
  });

  it('lists clients paginated and searchable by name or phone', async () => {
    await register.execute({
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });
    await register.execute({
      firstName: 'Beto',
      lastName: 'Diaz',
      phone: '987654321',
      marketingConsent: true,
      channel: 'nfc',
    });

    const list = new ListClientsUseCase(clients);
    const all = await list.execute('', 1, 20);
    expect(all.total).toBe(2);

    const byName = await list.execute('ana', 1, 20);
    expect(byName.items).toHaveLength(1);
    expect(byName.items[0].firstName).toBe('Ana');
  });

  it('filters clients by marketing consent', async () => {
    await register.execute({
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });
    await register.execute({
      firstName: 'Beto',
      lastName: 'Diaz',
      phone: '987654321',
      marketingConsent: true,
      channel: 'nfc',
    });
    await clients.update((await clients.findByPhone('51987654321'))!.id, {
      marketingConsent: false,
    });

    const list = new ListClientsUseCase(clients);
    const declined = await list.execute('', 1, 20, false);
    expect(declined.items.map((c) => c.firstName)).toEqual(['Beto']);

    const approved = await list.execute('', 1, 20, true);
    expect(approved.items.map((c) => c.firstName)).toEqual(['Ana']);
  });

  it('gets a client by id and throws when missing', async () => {
    const { client } = await register
      .execute({
        firstName: 'Ana',
        lastName: 'Lopez',
        phone: '965728013',
        marketingConsent: true,
        channel: 'qr',
      })
      .then((r) => r);

    const getClient = new GetClientUseCase(clients);
    expect((await getClient.execute(client.id)).id).toBe(client.id);
    await expect(getClient.execute('missing')).rejects.toThrow(
      ClientNotFoundError,
    );
  });

  it('returns a client history in reverse chronological order', async () => {
    const { client } = await register.execute({
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });
    await events.create({
      clientId: client.id,
      phoneE164: client.phoneE164,
      type: 'visita',
      rejectReason: null,
      channel: 'manual',
      occurredAt: new Date(Date.now() + 1000),
    });

    const history = new GetClientHistoryUseCase(clients, events);
    const result = await history.execute(client.id);
    expect(result.map((e) => e.type)).toEqual(['visita', 'registro']);
  });

  it('lists community events filtered by type', async () => {
    await register.execute({
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });
    await register
      .execute({
        firstName: 'X',
        lastName: 'Y',
        phone: 'invalid',
        marketingConsent: true,
        channel: 'qr',
      })
      .catch(() => undefined);

    const list = new ListCommunityEventsUseCase(events);
    const rejected = await list.execute(
      undefined,
      undefined,
      'registro_rechazado',
    );
    expect(rejected).toHaveLength(1);
  });

  it('updates a client name and consent', async () => {
    const { client } = await register.execute({
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '965728013',
      marketingConsent: true,
      channel: 'qr',
    });

    const update = new UpdateClientUseCase(clients);
    const updated = await update.execute(client.id, {
      firstName: 'Ana Maria',
      marketingConsent: false,
    });

    expect(updated.firstName).toBe('Ana Maria');
    expect(updated.marketingConsent).toBe(false);
  });

  it('throws ClientNotFoundError updating an unknown client', async () => {
    const update = new UpdateClientUseCase(clients);
    await expect(update.execute('missing', {})).rejects.toThrow(
      ClientNotFoundError,
    );
  });
});
