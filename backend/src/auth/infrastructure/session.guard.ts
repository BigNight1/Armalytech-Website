import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../shared/infrastructure/public.decorator';
import { SessionTokenService } from './session-token.service';
import { SESSION_COOKIE_NAME } from './session.types';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../domain/user-repository.port';

/**
 * Global guard (ADR 0021): every route is protected unless marked `@Public()`.
 * Validates the JWT cookie and verifies in MongoDB that:
 * 1) The user still exists
 * 2) The user is active (not deactivated)
 * 3) The tokenVersion matches (sessions revoked on password/email change or logout)
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionTokenService: SessionTokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;

    const raw = cookies?.[SESSION_COOKIE_NAME];

    if (!raw || typeof raw !== 'string') {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = await this.sessionTokenService.decode(raw);
    if (!payload) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException(
        'La sesión ha expirado por cambio de credenciales',
      );
    }

    // Attach user to request
    (request as Request & { user?: unknown; admin?: unknown }).user = user;
    (request as Request & { admin?: unknown }).admin = {
      sub: user.id,
      email: user.email,
      username: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      mustChangePassword: user.mustChangePassword,
    };

    return true;
  }
}
