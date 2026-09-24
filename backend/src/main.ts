import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/infrastructure/http-exception.filter';

/**
 * Local dev entry point (`pnpm start:dev`). Vercel uses `api/index.ts`
 * instead, which builds the same Nest app but never calls `listen()`
 * (ADR 0002 / ADR 0011).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser(process.env.SESSION_SECRET));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ArmalyTech backend listening on http://localhost:${port}/api`);
}

bootstrap();
