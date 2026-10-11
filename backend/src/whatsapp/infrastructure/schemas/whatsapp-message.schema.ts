import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  WhatsAppMessageError,
  WhatsAppMessageStatus,
  WhatsAppTrigger,
} from '../../domain/whatsapp-message.entity';

export type WhatsAppMessageDocument = HydratedDocument<WhatsAppMessageModel>;

@Schema({ collection: 'whatsapp_messages', timestamps: true })
export class WhatsAppMessageModel {
  @Prop({ type: String })
  ticketId?: string;

  @Prop({ type: String })
  clientId?: string;

  @Prop({ required: true })
  template!: string;

  @Prop({ required: true })
  to!: string;

  @Prop({ type: String })
  wamid?: string;

  @Prop({
    required: true,
    enum: ['sent', 'delivered', 'read', 'failed'],
  })
  status!: WhatsAppMessageStatus;

  @Prop(
    raw({
      code: { type: String },
      title: { type: String },
      message: { type: String },
    }),
  )
  error?: WhatsAppMessageError;

  @Prop({ required: true, default: false })
  insideServiceWindow!: boolean;

  @Prop({ required: true, enum: ['manual', 'auto'] })
  trigger!: WhatsAppTrigger;

  @Prop({ type: String })
  sentById?: string;

  @Prop({ type: String })
  sentByEmail?: string;

  @Prop({ required: true })
  sentAt!: Date;

  @Prop({ required: true })
  statusAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WhatsAppMessageSchema =
  SchemaFactory.createForClass(WhatsAppMessageModel);
WhatsAppMessageSchema.index({ wamid: 1 }, { unique: true, sparse: true });
WhatsAppMessageSchema.index({ ticketId: 1, template: 1 });
