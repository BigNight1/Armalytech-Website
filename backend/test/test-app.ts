import { ValidationPipe, INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/infrastructure/http-exception.filter';
import { resolveTrustProxyHops } from '../src/shared/config/trust-proxy';

/**
 * Spins up a full Nest app against an in-memory MongoDB instance
 * (mongodb-memory-server, ADR 0003's "local/in-memory Mongo for dev and
 * tests" fallback while there is no Atlas URI yet).
 */
export async function createTestApp(
  envOverrides: Record<string, string> = {},
  /** Lets a spec swap providers (e.g. `.overrideProvider(WHATSAPP_SENDER)`). */
  configure: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
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
  // No proxy in front of the test server: `X-Forwarded-For` must be ignored,
  // otherwise a spec could pick its own throttle tracker. A spec that needs to
  // exercise the trusted-proxy path passes this override explicitly.
  process.env.TRUST_PROXY_HOPS = envOverrides.TRUST_PROXY_HOPS ?? '0';

  const moduleRef = await configure(
    Test.createTestingModule({
      imports: [AppModule],
    }),
  ).compile();

  // rawBody mirrors `createNestApp` (webhook signatures need the exact bytes).
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    rawBody: true,
  });
  app.setGlobalPrefix('api');
  // Mirrors `createNestApp` (B8): never advertise the framework in a response.
  app.disable('x-powered-by');
  app.set('trust proxy', resolveTrustProxyHops());
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
