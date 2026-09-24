import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './shared/config/env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { CashClosingsModule } from './cash-closings/cash-closings.module';
import { CommunityModule } from './community/community.module';
import { StaffModule } from './staff/staff.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      // Tests must never read the developer's real `.env` (admin credentials,
      // Atlas URI): its values would win over the per-spec overrides.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
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
  ],
})
export class AppModule {}
