import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../shared/infrastructure/public.decorator';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { GetCurrentAdminUseCase } from '../application/get-current-admin.use-case';
import { CurrentAdmin } from './current-admin.decorator';
import { LoginDto } from './dto/login.dto';
import { SessionTokenService } from './session-token.service';
import { SessionPayload, SESSION_COOKIE_NAME } from './session.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
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

  /**
   * 2026-10-25 hardening (C1): logout revokes, it no longer only deletes the
   * cookie. `@Public()` + an unconditional `{ ok: true }` make it idempotent
   * and non-informative (it never reveals whether a session existed), while a
   * valid cookie bumps `tokenVersion` so the token it carried — even a stolen
   * copy — is rejected by `SessionGuard` on the very next request.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });

    const cookies = req.cookies as Record<string, string> | undefined;
    const raw = cookies?.[SESSION_COOKIE_NAME];
    if (typeof raw === 'string' && raw.length > 0) {
      const payload = await this.sessionTokenService.decode(raw);
      if (payload?.sub) {
        await this.logoutUseCase.execute(payload.sub);
      }
    }

    return { ok: true };
  }

  @Get('me')
  async me(@CurrentAdmin() session: SessionPayload): Promise<{
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
