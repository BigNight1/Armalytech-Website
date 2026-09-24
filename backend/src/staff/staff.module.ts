import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffController } from './infrastructure/staff.controller';
import {
  ListStaffUseCase,
  CreateStaffUseCase,
  ToggleStaffStatusUseCase,
  ResetStaffPasswordUseCase,
} from './application/staff.use-cases';

@Module({
  imports: [AuthModule],
  controllers: [StaffController],
  providers: [
    ListStaffUseCase,
    CreateStaffUseCase,
    ToggleStaffStatusUseCase,
    ResetStaffPasswordUseCase,
  ],
})
export class StaffModule {}
