import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhatsAppWebhookEventDocument =
  HydratedDocument<WhatsAppWebhookEventModel>;

/** Processed webhook deliveries, kept 7 days for idempotency. */
export const WEBHOOK_EVENT_TTL_SECONDS = 7 * 24 * 60 * 60;

@Schema({ collection: 'whatsapp_webhook_events' })
export class WhatsAppWebhookEventModel {
  @Prop({ required: true })
  key!: string;

  @Prop({ type: Date, default: Date.now, expires: WEBHOOK_EVENT_TTL_SECONDS })
  createdAt!: Date;
}

export const WhatsAppWebhookEventSchema = SchemaFactory.createForClass(
  WhatsAppWebhookEventModel,
);
WhatsAppWebhookEventSchema.index({ key: 1 }, { unique: true });
