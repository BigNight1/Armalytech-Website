import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../domain/user.entity';
import { SessionPayload } from './session.types';

/**
 * ADR 0021: Issues and verifies JWT tokens traveling in an httpOnly cookie.
 * Signed with JWT_SECRET (or SESSION_SECRET as fallback).
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
    return (
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('SESSION_SECRET') ||
      'default-jwt-secret-armalytech'
    );
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

  // Backward compatibility with Admin entity
  async buildPayload(admin: { id: string; username: string }): Promise<string> {
    return this.buildToken({
      id: admin.id,
      email: admin.username,
      passwordHash: '',
      role: 'owner',
      active: true,
      tokenVersion: 0,
      mustChangePassword: false,
    });
  }
}
