export const MIN_JWT_SECRET_LENGTH = 32;
export const MIN_TICKET_SECRET_LENGTH = 32;

export interface ResolvedJwtSecret {
  secret: string;
  /** True when only the deprecated SESSION_SECRET alias was set. */
  usedDeprecatedAlias: boolean;
}

/**
 * Single source of truth for resolving the JWT signing secret.
 *
 * `JWT_SECRET` is the canonical env var. `SESSION_SECRET` is accepted as a
 * deprecated alias during the migration window (the developer's local .env
 * and Vercel currently only set SESSION_SECRET). Whichever is set must be
 * at least MIN_JWT_SECRET_LENGTH characters; if neither is set, or the
 * value is too short, this throws so the app fails fast on startup
 * (ADR 0010) instead of signing tokens with a missing or weak secret.
 */
export function resolveJwtSecret(env: {
  JWT_SECRET?: string;
  SESSION_SECRET?: string;
}): ResolvedJwtSecret {
  const jwtSecret = env.JWT_SECRET?.trim();
  const sessionSecret = env.SESSION_SECRET?.trim();
  const secret = jwtSecret || sessionSecret;

  if (!secret) {
    throw new Error(
      'Missing JWT signing secret: set JWT_SECRET (or the deprecated SESSION_SECRET) in the environment.',
    );
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT signing secret must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`,
    );
  }

  return { secret, usedDeprecatedAlias: !jwtSecret && !!sessionSecret };
}

/**
 * Single source of truth for the device-key encryption secret (ADR 0025).
 * Unlike `resolveJwtSecret`, there is no deprecated alias and no fallback:
 * a missing or too-short `TICKET_SECRET_KEY` fails the app fast on startup
 * rather than silently deriving a predictable key from `JWT_SECRET` or a
 * hardcoded string.
 */
export function resolveTicketSecretKey(env: {
  TICKET_SECRET_KEY?: string;
}): string {
  const secret = env.TICKET_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error(
      'Missing TICKET_SECRET_KEY: set it in the environment (device-key encryption has no fallback).',
    );
  }
  if (secret.length < MIN_TICKET_SECRET_LENGTH) {
    throw new Error(
      `TICKET_SECRET_KEY must be at least ${MIN_TICKET_SECRET_LENGTH} characters long.`,
    );
  }
  return secret;
}
