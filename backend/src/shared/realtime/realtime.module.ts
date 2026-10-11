import { Global, Module } from '@nestjs/common';
import { RealtimePublisher } from './realtime-publisher';
import { RealtimeBus } from './realtime-bus';
import { EventsController } from './events.controller';

/**
 * Global module (ADR 0028): exports `RealtimePublisher` so any feature
 * module can inject it without importing this module explicitly, and
 * registers `GET /api/events` (`EventsController`).
 */
@Global()
@Module({
  controllers: [EventsController],
  providers: [
    RealtimeBus,
    { provide: RealtimePublisher, useExisting: RealtimeBus },
  ],
  exports: [RealtimePublisher, RealtimeBus],
})
export class RealtimeModule {}
