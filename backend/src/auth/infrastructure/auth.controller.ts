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
  ): Promise<{
    ok: true;
    data: {
      id: string;
      email: string;
      username: string;
      role: string;
      mustChangePassword: boolean;
    };
  }> {
    const user = await this.loginUseCase.execute(dto);
    const token = await this.sessionTokenService.buildToken(user);
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      signed: false, // Standard JWT verification
      maxAge: this.sessionTokenService.getSessionMaxAgeSeconds() * 1000,
      path: '/',
    });

    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
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
  ): Promise<{
    ok: true;
    data: {
      id: string;
      email: string;
      username: string;
      role: string;
      mustChangePassword: boolean;
    };
  }> {
    const user = await this.getCurrentAdminUseCase.execute(session.sub);
    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
