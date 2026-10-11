export const WHATSAPP_WEBHOOK_EVENT_REPOSITORY = Symbol(
  'WHATSAPP_WEBHOOK_EVENT_REPOSITORY',
);

export interface WhatsAppWebhookEventRepository {
  /**
   * Atomically records an `X-Idempotency-Key`. Returns `true` the first time
   * the key is seen and `false` for a repeated delivery.
   */
  register(key: string): Promise<boolean>;
}
