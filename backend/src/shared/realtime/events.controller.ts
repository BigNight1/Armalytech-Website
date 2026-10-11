import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { RealtimeBus } from './realtime-bus';

/** Keeps intermediaries (nginx/Traefik) and idle browser connections from timing out the SSE stream (ADR 0028). */
const PING_INTERVAL_MS = 25_000;

/**
 * `GET /api/events` (ADR 0028): Server-Sent Events stream. Not `@Public()` —
 * the global `SessionGuard` protects it like every other route, so only an
 * authenticated admin session can subscribe.
 *
 * Emits:
 * - `event: invalidate`, `data: { topic, reason? }` whenever a write
 *   publishes through `RealtimePublisher`;
 * - `event: ping`, `data: {}` every 25s as a heartbeat.
 */
@Controller('events')
export class EventsController {
  constructor(private readonly bus: RealtimeBus) {}

  @Sse()
  stream(): Observable<MessageEvent> {
    const invalidate$: Observable<MessageEvent> = this.bus.stream().pipe(
      map((event) => ({
        type: 'invalidate',
        data: event,
      })),
    );

    const ping$: Observable<MessageEvent> = interval(PING_INTERVAL_MS).pipe(
      map(() => ({
        type: 'ping',
        data: {},
      })),
    );

    return merge(invalidate$, ping$);
  }
}
