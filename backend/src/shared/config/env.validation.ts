import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

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

  @IsNotEmpty()
  @IsString()
  SESSION_SECRET!: string;

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

  return validatedConfig;
}
