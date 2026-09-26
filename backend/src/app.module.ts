import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validate } from './shared/config/env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { CashClosingsModule } from './cash-closings/cash-closings.module';
import { CommunityModule } from './community/community.module';
import { StaffModule } from './staff/staff.module';
import { AccountModule } from './account/account.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      // Tests must never read the developer's real `.env` (admin credentials,
      // Atlas URI): its values would win over the per-spec overrides.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    // High global ceiling: only the per-route @Throttle limits (login, public
    // register) are meant to bite; normal panel use (grid pastes, prefetch) must not.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }]),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    HealthModule,
    AuthModule,
    InventoryModule,
    CashClosingsModule,
    CommunityModule,
    StaffModule,
    AccountModule,
    TicketsModule,
  ],
  providers: [
    // Registers ThrottlerGuard globally so the `@Throttle(...)` decorators
    // (e.g. login's 5/60s limit) are actually enforced. Without this, the
    // decorator only attaches metadata that nothing ever reads.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
