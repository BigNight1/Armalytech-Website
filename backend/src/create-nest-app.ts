import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/infrastructure/http-exception.filter';

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
  // Cookies are verified as JWTs (ADR 0021), not via cookie-parser signing.
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return app;
}
