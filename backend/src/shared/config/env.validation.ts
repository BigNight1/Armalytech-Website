import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { resolveJwtSecret, resolveTicketSecretKey } from './secrets';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsNotEmpty()
  @IsString()
  MONGODB_URI!: string;

  // Deprecated alias for JWT_SECRET, see `resolveJwtSecret`. At least one
  // of the two must be set; enforced below rather than with @IsNotEmpty
  // since neither is individually required.
  @IsOptional()
  @IsString()
  SESSION_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_USERNAME?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsNumberString()
  SESSION_MAX_AGE_SECONDS?: string;

  // Number of reverse proxies to trust when reading the client IP (R-04).
  // Optional: `resolveTrustProxyHops` defaults to 1 in production and 0
  // elsewhere, so a missing value never blocks the boot.
  @IsOptional()
  @IsNumberString()
  TRUST_PROXY_HOPS?: string;

  @IsOptional()
  @IsString()
  DNS_SERVERS?: string;

  // Required (no fallback, see resolveTicketSecretKey), but declared
  // @IsOptional() here so the length/presence check happens once, below,
  // with a clearer error message than class-validator's generic one.
  @IsOptional()
  @IsString()
  TICKET_SECRET_KEY?: string;

  // WhatsApp via Kapso (ADR 0029). All optional: without credentials the
  // backend boots with a no-op sender and sending answers 503.
  @IsOptional()
  @IsString()
  KAPSO_API_KEY?: string;

  @IsOptional()
  @IsString()
  KAPSO_PHONE_NUMBER_ID?: string;

  @IsOptional()
  @IsString()
  KAPSO_API_BASE_URL?: string;

  @IsOptional()
  @IsString()
  KAPSO_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  PUBLIC_SITE_URL?: string;

  // An empty value counts as unset; anything else must be 'true' or 'false'.
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsIn(['true', 'false'])
  WHATSAPP_AUTO_TICKET_LISTO?: string;
}

/**
 * Validates process.env against the required shape for this backend.
 * Fails fast on startup (per ADR 0010) instead of surfacing a cryptic
 * runtime error the first time a missing variable is used.
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.toString()}`);
  }

  // Fails fast (throws) if neither JWT_SECRET nor SESSION_SECRET is set, or
  // the resolved secret is too short.
  const { usedDeprecatedAlias } = resolveJwtSecret({
    JWT_SECRET: validatedConfig.JWT_SECRET,
    SESSION_SECRET: validatedConfig.SESSION_SECRET,
  });
  if (usedDeprecatedAlias) {
    // eslint-disable-next-line no-console
    console.warn('SESSION_SECRET is deprecated, rename it to JWT_SECRET');
  }

  // Fails fast if TICKET_SECRET_KEY is missing or too short (ADR 0025
  // fix-up): device keys must never fall back to JWT_SECRET or a hardcoded
  // value.
  resolveTicketSecretKey({
    TICKET_SECRET_KEY: validatedConfig.TICKET_SECRET_KEY,
  });

  return validatedConfig;
}
