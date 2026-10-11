import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import {
  RealtimePublisher,
  RealtimeReason,
  RealtimeTopic,
} from './realtime-publisher';

export interface RealtimeEvent {
  topic: RealtimeTopic;
  reason?: RealtimeReason;
}

/**
 * In-memory implementation of `RealtimePublisher` (ADR 0028), backed by an
 * rxjs `Subject`. Serves a single Nest process/container: with several
 * replicas this must be swapped for a Redis pub/sub adapter behind the same
 * port, without touching any caller.
 *
 * `publish` never throws: any error is caught and logged so a realtime
 * notification failure can never fail the write that triggered it.
 */
@Injectable()
export class RealtimeBus extends RealtimePublisher {
  private readonly logger = new Logger(RealtimeBus.name);
  private readonly subject = new Subject<RealtimeEvent>();

  publish(
    topics: RealtimeTopic | RealtimeTopic[],
    reason?: RealtimeReason,
  ): void {
    try {
      const list = Array.isArray(topics) ? topics : [topics];
      for (const topic of list) {
        this.subject.next({ topic, reason });
      }
    } catch (error) {
      this.logger.error(
        `Failed to publish realtime event for topics ${JSON.stringify(topics)}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  stream(): Observable<RealtimeEvent> {
    return this.subject.asObservable();
  }
}
