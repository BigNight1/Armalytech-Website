import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Checks `X-Webhook-Signature`: the HMAC-SHA256 (hex) of the exact raw
 * request body keyed with the webhook secret. Constant-time comparison,
 * length checked first (`timingSafeEqual` throws on different lengths).
 */
export function isValidKapsoSignature(
  secret: string,
  rawBody: Buffer | string | undefined,
  signature: string | undefined,
): boolean {
  if (!secret || rawBody === undefined || !signature) return false;

  const provided = signature
    .trim()
    .replace(/^sha256=/i, '')
    .toLowerCase();
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}
