import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../domain/user.entity';
import { resolveJwtSecret } from '../../shared/config/secrets';
import { SessionPayload } from './session.types';

/**
 * ADR 0021: Issues and verifies JWT tokens traveling in an httpOnly cookie.
 * Signed with JWT_SECRET (SESSION_SECRET accepted as a deprecated alias,
 * see `resolveJwtSecret`). There is no fallback secret: `env.validation.ts`
 * already refuses to start the app if neither is set.
 */
@Injectable()
export class SessionTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getSessionMaxAgeSeconds(): number {
    const raw = this.configService.get<string>('SESSION_MAX_AGE_SECONDS');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12 * 60 * 60;
  }

  private getSecret(): string {
    return resolveJwtSecret({
      JWT_SECRET: this.configService.get<string>('JWT_SECRET'),
      SESSION_SECRET: this.configService.get<string>('SESSION_SECRET'),
    }).secret;
  }

  async buildToken(user: User): Promise<string> {
    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      username: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      mustChangePassword: user.mustChangePassword,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.getSecret(),
      expiresIn: `${this.getSessionMaxAgeSeconds()}s`,
    });
  }

  async decode(token: string): Promise<SessionPayload | null> {
    try {
      return await this.jwtService.verifyAsync<SessionPayload>(token, {
        secret: this.getSecret(),
      });
    } catch {
      return null;
    }
  }
}
