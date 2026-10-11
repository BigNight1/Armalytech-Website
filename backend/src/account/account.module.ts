import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './infrastructure/account.controller';
import {
  UpdateEmailUseCase,
  UpdatePasswordUseCase,
} from './application/account.use-cases';

@Module({
  imports: [AuthModule],
  controllers: [AccountController],
  providers: [UpdateEmailUseCase, UpdatePasswordUseCase],
})
export class AccountModule {}
