import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Admin } from '../domain/admin.entity';
import { SessionPayload } from './session.types';

/**
 * Encodes/decodes the (already cookie-signed, see AuthController) session
 * payload. Signing against tampering is delegated to `cookie-parser`'s
 * `signed: true` cookies using `SESSION_SECRET`; this service only handles
 * the payload shape and expiry.
 */
@Injectable()
export class SessionTokenService {
  constructor(private readonly configService: ConfigService) {}

  getSessionMaxAgeSeconds(): number {
    const raw = this.configService.get<string>('SESSION_MAX_AGE_SECONDS');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12 * 60 * 60;
  }

  buildPayload(admin: Admin): SessionPayload {
    const now = Math.floor(Date.now() / 1000);
    return {
      sub: admin.id,
      username: admin.username,
      iat: now,
      exp: now + this.getSessionMaxAgeSeconds(),
    };
  }

  encode(payload: SessionPayload): string {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  decode(raw: string): SessionPayload | null {
    try {
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const payload = JSON.parse(json) as SessionPayload;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.exp !== 'number' ||
        payload.exp * 1000 < Date.now()
      ) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
