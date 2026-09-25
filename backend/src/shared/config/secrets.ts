export const MIN_JWT_SECRET_LENGTH = 32;

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
