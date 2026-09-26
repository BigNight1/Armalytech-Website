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
  process.env.JWT_SECRET =
    envOverrides.JWT_SECRET ?? 'test-jwt-secret-armalytech-e2e-tests-min32';
  process.env.TICKET_SECRET_KEY =
    envOverrides.TICKET_SECRET_KEY ?? 'test-ticket-secret-armalytech-e2e-min32';
  delete process.env.SESSION_SECRET;
  process.env.NODE_ENV = 'test';
  if (envOverrides.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL = envOverrides.ADMIN_EMAIL;
  } else {
    delete process.env.ADMIN_EMAIL;
  }
  process.env.ADMIN_USERNAME = envOverrides.ADMIN_USERNAME ?? 'admin';
  process.env.ADMIN_PASSWORD = envOverrides.ADMIN_PASSWORD ?? 'test-password';
  process.env.SESSION_MAX_AGE_SECONDS = '43200';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  // Cookies are verified as JWTs (ADR 0021), not via cookie-parser signing.
  app.use(cookieParser());
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
