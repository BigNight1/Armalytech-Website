import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../shared/infrastructure/roles.decorator';
import {
  ListStaffUseCase,
  CreateStaffUseCase,
  ToggleStaffStatusUseCase,
  ResetStaffPasswordUseCase,
} from '../application/staff.use-cases';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { ToggleStatusDto } from '../dto/toggle-status.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { User } from '../../auth/domain/user.entity';

@Controller('staff')
@Roles('owner')
export class StaffController {
  constructor(
    private readonly listStaffUseCase: ListStaffUseCase,
    private readonly createStaffUseCase: CreateStaffUseCase,
    private readonly toggleStaffStatusUseCase: ToggleStaffStatusUseCase,
    private readonly resetStaffPasswordUseCase: ResetStaffPasswordUseCase,
  ) {}

  @Get()
  async list(): Promise<{ ok: true; data: Partial<User>[] }> {
    const users = await this.listStaffUseCase.execute();
    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      active: u.active,
      mustChangePassword: u.mustChangePassword,
      createdBy: u.createdBy,
      createdAt: u.createdAt,
    }));
    return { ok: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateStaffDto,
    @Req() req: Request,
  ): Promise<{ ok: true; data: Partial<User> }> {
    const creator = (req as Request & { user: User }).user;
    const user = await this.createStaffUseCase.execute(dto, creator.email);
    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
      },
    };
  }

  @Patch(':id/status')
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: ToggleStatusDto,
    @Req() req: Request,
  ): Promise<{ ok: true; data: Partial<User> }> {
    const requester = (req as Request & { user: User }).user;
    const user = await this.toggleStaffStatusUseCase.execute(
      id,
      dto.active,
      requester.id,
    );
    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ ok: true; data: { message: string } }> {
    await this.resetStaffPasswordUseCase.execute(id, dto.password);
    return {
      ok: true,
      data: { message: 'Contraseña reseteada correctamente' },
    };
  }
}
