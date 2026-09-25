import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
import { resolveJwtSecret } from './secrets';

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

  @IsOptional()
  @IsString()
  DNS_SERVERS?: string;
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

  return validatedConfig;
}
