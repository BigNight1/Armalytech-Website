import 'reflect-metadata';
import serverlessHttp from 'serverless-http';
import type { IncomingMessage, ServerResponse } from 'http';
import { createNestApp } from '../src/create-nest-app';

/**
 * Vercel serverless entry (ADR 0002 / ADR 0011). Reuses a single cached
 * Nest instance across warm invocations of the same function container,
 * so MongoDB's connection (ADR 0003, ADR 0010) is reused instead of
 * reopened on every request.
 */
let cachedHandler: ReturnType<typeof serverlessHttp> | undefined;

async function getHandler() {
  if (!cachedHandler) {
    const app = await createNestApp();
    const expressInstance = app.getHttpAdapter().getInstance();
    cachedHandler = serverlessHttp(expressInstance);
  }
  return cachedHandler;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const nestHandler = await getHandler();
  await nestHandler(req, res);
}
