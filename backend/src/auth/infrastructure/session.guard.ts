import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../shared/infrastructure/public.decorator';
import { SessionTokenService } from './session-token.service';
import { SESSION_COOKIE_NAME } from './session.types';

/**
 * Global guard (ADR 0004/0010): every route is protected unless marked
 * `@Public()`. Reads the signed session cookie set by cookie-parser
 * (configured with SESSION_SECRET) and rejects with 401 when missing,
 * tampered with, or expired.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const signedCookies = (
      request as Request & { signedCookies?: Record<string, string | false> }
    ).signedCookies;
    const raw = signedCookies?.[SESSION_COOKIE_NAME];

    if (!raw) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = this.sessionTokenService.decode(raw);
    if (!payload) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    (request as Request & { admin?: unknown }).admin = payload;
    return true;
  }
}
