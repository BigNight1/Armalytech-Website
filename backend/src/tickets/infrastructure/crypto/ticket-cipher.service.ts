import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MIN_TICKET_SECRET_LENGTH } from '../../../shared/config/secrets';

@Injectable()
export class TicketCipherService {
  private readonly secretKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    // No fallback (ADR 0025 fix-up): the device-key cipher must never fall
    // back to JWT_SECRET or a hardcoded value, since that would let anyone
    // who knows the source decrypt stored device keys. This also fails the
    // app fast at startup via `validate()` in env.validation.ts; the check
    // here guards direct instantiation (e.g. from unit tests).
    const rawKey = this.configService.get<string>('TICKET_SECRET_KEY');
    if (!rawKey || rawKey.trim().length < MIN_TICKET_SECRET_LENGTH) {
      throw new Error(
        `TICKET_SECRET_KEY must be set and at least ${MIN_TICKET_SECRET_LENGTH} characters long.`,
      );
    }
    // Derives a predictable 32-byte key for AES-256
    this.secretKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(plainText?: string): string | undefined {
    if (!plainText || plainText.trim() === '') return undefined;
    const iv = crypto.randomBytes(12); // 96-bit IV standard for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.secretKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(cipherText?: string): string | undefined {
    if (!cipherText || !cipherText.includes(':')) return undefined;
    try {
      const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) return undefined;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.secretKey,
        iv,
      );
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return undefined;
    }
  }
}
