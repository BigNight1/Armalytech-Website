import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhatsAppContactDocument = HydratedDocument<WhatsAppContactModel>;

@Schema({ collection: 'whatsapp_contacts', timestamps: { createdAt: false } })
export class WhatsAppContactModel {
  @Prop({ required: true })
  phoneE164!: string;

  @Prop({ type: Date })
  lastInboundAt?: Date;

  @Prop({ type: Date })
  marketingOptOutAt?: Date;

  updatedAt?: Date;
}

export const WhatsAppContactSchema =
  SchemaFactory.createForClass(WhatsAppContactModel);
WhatsAppContactSchema.index({ phoneE164: 1 }, { unique: true });
