import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../../shared/infrastructure/public.decorator';

const READY_STATE_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Health is a passive, framework-native concern with no business rule to
 * protect, so it skips the domain/application layers and lives directly in
 * infrastructure as a thin HTTP adapter over the Mongoose connection state.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  check(): {
    ok: boolean;
    data: { status: string; db: { state: string; readyState: number } };
  } {
    const readyState = this.connection.readyState;
    const dbOk = readyState === 1;

    return {
      ok: dbOk,
      data: {
        status: dbOk ? 'ok' : 'degraded',
        db: {
          state: READY_STATE_LABELS[readyState] ?? 'unknown',
          readyState,
        },
      },
    };
  }
}
