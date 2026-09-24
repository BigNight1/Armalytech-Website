import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../../shared/infrastructure/public.decorator';
import { LoginUseCase } from '../application/login.use-case';
import { GetCurrentAdminUseCase } from '../application/get-current-admin.use-case';
import { CurrentAdmin } from './current-admin.decorator';
import { LoginDto } from './dto/login.dto';
import { SessionTokenService } from './session-token.service';
import { SessionPayload, SESSION_COOKIE_NAME } from './session.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentAdminUseCase: GetCurrentAdminUseCase,
    private readonly sessionTokenService: SessionTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; data: { username: string } }> {
    const admin = await this.loginUseCase.execute(dto);
    const payload = this.sessionTokenService.buildPayload(admin);
    const value = this.sessionTokenService.encode(payload);
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie(SESSION_COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      signed: true,
      maxAge: this.sessionTokenService.getSessionMaxAgeSeconds() * 1000,
      path: '/',
    });

    return { ok: true, data: { username: admin.username } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(
    @CurrentAdmin() session: SessionPayload,
  ): Promise<{ ok: true; data: { username: string } }> {
    const admin = await this.getCurrentAdminUseCase.execute(session.sub);
    return { ok: true, data: { username: admin.username } };
  }
}
