import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/infrastructure/http-exception.filter';
import { resolveTrustProxyHops } from './shared/config/trust-proxy';

/**
 * Shared Nest bootstrap used by both `main.ts` (local dev, calls `listen()`)
 * and `api/index.ts` (Vercel serverless, wraps the underlying Express
 * instance with `serverless-http` and never calls `listen()`).
 */
export async function createNestApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    // Kapso webhook signatures are computed over the exact raw bytes (ADR 0029).
    rawBody: true,
  });

  app.setGlobalPrefix('api');
  // Don't advertise the stack/version to anonymous callers (2026-10-25
  // hardening, C9): Express sends `X-Powered-By: Express` by default.
  app.disable('x-powered-by');
  // Behind nginx (Docker) or Vercel the TCP peer is the proxy, not the client.
  // Without this the per-IP throttler (login 5/min) would see one shared proxy
  // address and either throttle everybody as one bucket or count an internal
  // IP, so the limit would be useless or actively harmful (SECURITY.md R-04).
  // Defaults to 1 hop in production and 0 elsewhere (tests must not trust
  // `X-Forwarded-For`, or a caller could pick its own tracker by faking it).
  app.set('trust proxy', resolveTrustProxyHops());
  // Cookies are verified as JWTs (ADR 0021), not via cookie-parser signing.
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return app;
}
