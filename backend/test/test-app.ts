import { ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/infrastructure/http-exception.filter';

/**
 * Spins up a full Nest app against an in-memory MongoDB instance
 * (mongodb-memory-server, ADR 0003's "local/in-memory Mongo for dev and
 * tests" fallback while there is no Atlas URI yet).
 */
export async function createTestApp(
  envOverrides: Record<string, string> = {},
): Promise<{
  app: INestApplication;
  mongod: MongoMemoryServer;
}> {
  const mongod = await MongoMemoryServer.create();

  process.env.MONGODB_URI = mongod.getUri();
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_USERNAME = envOverrides.ADMIN_USERNAME ?? 'admin';
  process.env.ADMIN_PASSWORD = envOverrides.ADMIN_PASSWORD ?? 'test-password';
  process.env.SESSION_MAX_AGE_SECONDS = '43200';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser(process.env.SESSION_SECRET));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return { app, mongod };
}

export async function closeTestApp(
  app: INestApplication,
  mongod: MongoMemoryServer,
): Promise<void> {
  await app.close();
  await mongod.stop();
}
