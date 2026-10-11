import { MessageEvent } from '@nestjs/common';
import { EventsController } from '../events.controller';
import { RealtimeBus } from '../realtime-bus';

describe('EventsController', () => {
  it('emits an invalidate MessageEvent when a topic is published on the bus', () => {
    const bus = new RealtimeBus();
    const controller = new EventsController(bus);
    const events: MessageEvent[] = [];
    const sub = controller.stream().subscribe((event) => events.push(event));

    bus.publish('tickets');

    expect(events).toEqual([
      { type: 'invalidate', data: { topic: 'tickets', reason: undefined } },
    ]);

    sub.unsubscribe();
  });
});
