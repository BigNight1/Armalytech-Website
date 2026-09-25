import 'reflect-metadata';

// e2e tests run with a longer timeout because mongodb-memory-server can take
// a few seconds to download/start its binary on a cold cache.
jest.setTimeout(60_000);

// `AppModule`'s `ConfigModule.forRoot({ validate })` runs at import time (the
// `@Module` decorator evaluates its `imports` array as soon as the class is
// loaded), which happens before any spec's `beforeAll` gets to run. Seed
// placeholder values here (setupFilesAfterEnv runs before the spec file's
// own imports are evaluated) so that import-time validation passes; each
// spec's `createTestApp` then overwrites `MONGODB_URI` with the real
// mongodb-memory-server URI before compiling the Nest testing module, which
// is what `MongooseModule.forRootAsync`'s factory actually reads.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/placeholder';
process.env.JWT_SECRET ??= 'placeholder-jwt-secret-for-import-time-validation';
