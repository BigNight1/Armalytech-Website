import {
  Body,
  Controller,
  Headers,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../shared/infrastructure/public.decorator';
import { HandleKapsoWebhookUseCase } from '../application/handle-kapso-webhook.use-case';
import {
  WHATSAPP_WEBHOOK_EVENT_REPOSITORY,
  WhatsAppWebhookEventRepository,
} from '../domain/whatsapp-webhook-event-repository.port';
import { isValidKapsoSignature } from './kapso-webhook-signature';

/**
 * Inbound Kapso webhook (ADR 0029). Authenticated only by the HMAC signature
 * over the raw body, so it is `@Public()` (no admin session) and exempt from
 * throttling (Kapso may burst and retry). Always answers 200 for a valid
 * signature, whatever the event, so Kapso never retries ignorable events.
 */
@Public()
@SkipThrottle()
@Controller('webhooks')
export class KapsoWebhookController {
  private readonly logger = new Logger(KapsoWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly handler: HandleKapsoWebhookUseCase,
    @Inject(WHATSAPP_WEBHOOK_EVENT_REPOSITORY)
    private readonly processedEvents: WhatsAppWebhookEventRepository,
  ) {}

  @Post('kapso')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: unknown,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Headers('x-webhook-event') event: string | undefined,
    @Headers('x-webhook-batch') batchHeader: string | undefined,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
  ): Promise<{ ok: true }> {
    const secret = this.config.get<string>('KAPSO_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      throw new ServiceUnavailableException({
        message: 'webhook_not_configured',
        code: 'webhook_not_configured',
      });
    }
    if (!req.rawBody) {
      this.logger.error(
        'Raw body unavailable: the app must be created with rawBody: true',
      );
    }
    if (!isValidKapsoSignature(secret, req.rawBody, signature)) {
      throw new UnauthorizedException({
        message: 'invalid_signature',
        code: 'invalid_signature',
      });
    }

    const key = idempotencyKey?.trim();
    if (key && !(await this.processedEvents.register(key))) {
      return { ok: true };
    }

    const items = this.extractItems(body, batchHeader);
    for (const item of items) {
      try {
        await this.handler.execute(event?.trim(), item);
      } catch (error) {
        // Never fail the delivery over one bad item: log and carry on.
        this.logger.error(
          `Webhook ${event ?? 'unknown'} item failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return { ok: true };
  }

  private extractItems(
    body: unknown,
    batchHeader: string | undefined,
  ): unknown[] {
    const record =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : undefined;
    const isBatch =
      batchHeader?.trim().toLowerCase() === 'true' || record?.batch === true;
    if (isBatch) {
      return Array.isArray(record?.data) ? record.data : [];
    }
    return [body];
  }
}
