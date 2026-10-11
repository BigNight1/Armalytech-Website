import { RealtimeBus } from '../realtime-bus';
import { RealtimeEvent } from '../realtime-bus';

describe('RealtimeBus', () => {
  it('delivers a published event to a subscriber', () => {
    const bus = new RealtimeBus();
    const received: RealtimeEvent[] = [];
    const sub = bus.stream().subscribe((event) => received.push(event));

    bus.publish('clients', 'client_registered');

    expect(received).toEqual([
      { topic: 'clients', reason: 'client_registered' },
    ]);
    sub.unsubscribe();
  });

  it('fans out one event per topic when publishing an array', () => {
    const bus = new RealtimeBus();
    const received: RealtimeEvent[] = [];
    const sub = bus.stream().subscribe((event) => received.push(event));

    bus.publish(['tickets', 'inventory']);

    expect(received).toEqual([
      { topic: 'tickets', reason: undefined },
      { topic: 'inventory', reason: undefined },
    ]);
    sub.unsubscribe();
  });

  it('never throws, even if the underlying emission fails', () => {
    const bus = new RealtimeBus();
    // Simulates a genuine failure inside `publish` itself (rather than a
    // subscriber's own `next` callback throwing, which rxjs's SafeSubscriber
    // already isolates and reports asynchronously on its own).
    const subject = (bus as unknown as { subject: { next: () => void } })
      .subject;
    jest.spyOn(subject, 'next').mockImplementation(() => {
      throw new Error('emission exploded');
    });

    expect(() => bus.publish('sales')).not.toThrow();
  });
});
