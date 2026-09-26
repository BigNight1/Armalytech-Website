import { ConfigService } from '@nestjs/config';
import { TicketCipherService } from '../ticket-cipher.service';

function buildService(key: string | undefined): TicketCipherService {
  const configService = {
    get: (name: string) => (name === 'TICKET_SECRET_KEY' ? key : undefined),
  } as unknown as ConfigService;
  return new TicketCipherService(configService);
}

describe('TicketCipherService', () => {
  it('round-trips a plain value through encrypt/decrypt', () => {
    const service = buildService('a-valid-ticket-secret-key-32-chars!');
    const encrypted = service.encrypt('1234');

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe('1234');
    expect(service.decrypt(encrypted)).toBe('1234');
  });

  it('produces a different ciphertext on every call (random IV) but decrypts to the same value', () => {
    const service = buildService('a-valid-ticket-secret-key-32-chars!');
    const a = service.encrypt('9-8-7-6');
    const b = service.encrypt('9-8-7-6');

    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('9-8-7-6');
    expect(service.decrypt(b)).toBe('9-8-7-6');
  });

  it('throws at construction when TICKET_SECRET_KEY is missing', () => {
    expect(() => buildService(undefined)).toThrow(/TICKET_SECRET_KEY/);
  });

  it('throws at construction when TICKET_SECRET_KEY is shorter than 32 characters', () => {
    expect(() => buildService('too-short')).toThrow(/TICKET_SECRET_KEY/);
  });

  it('never falls back to a hardcoded or JWT-derived key', () => {
    // No JWT_SECRET is exposed by the fake ConfigService at all, so a
    // successful construction here would only be possible if the service
    // read some other env var or a hardcoded default — it must not.
    expect(() => buildService(undefined)).toThrow();
  });
});
