import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  UpdateEmailUseCase,
  UpdatePasswordUseCase,
} from '../application/account.use-cases';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { SessionTokenService } from '../../auth/infrastructure/session-token.service';
import { SESSION_COOKIE_NAME } from '../../auth/infrastructure/session.types';
import { User } from '../../auth/domain/user.entity';

@Controller('account')
export class AccountController {
  constructor(
    private readonly updateEmailUseCase: UpdateEmailUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly sessionTokenService: SessionTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Patch('email')
  @HttpCode(HttpStatus.OK)
  async updateEmail(
    @Body() dto: UpdateEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; data: { id: string; email: string } }> {
    const currentUser = (req as Request & { user: User }).user;
    const updated = await this.updateEmailUseCase.execute(currentUser.id, dto);

    // Re-issue JWT cookie so current session continues seamlessly with the new tokenVersion
    const token = await this.sessionTokenService.buildToken(updated);
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: this.sessionTokenService.getSessionMaxAgeSeconds() * 1000,
      path: '/',
    });

    return {
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
      },
    };
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; data: { message: string } }> {
    const currentUser = (req as Request & { user: User }).user;
    const updated = await this.updatePasswordUseCase.execute(currentUser.id, dto);

    // Re-issue JWT cookie
    const token = await this.sessionTokenService.buildToken(updated);
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: this.sessionTokenService.getSessionMaxAgeSeconds() * 1000,
      path: '/',
    });

    return {
      ok: true,
      data: { message: 'Contraseña actualizada correctamente' },
    };
  }
}
