import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CommunityChannel } from '../../domain/client.entity';
import { CommunityEventType } from '../../domain/community-event.entity';

export type CommunityEventDocument = HydratedDocument<CommunityEventModel>;

@Schema({ collection: 'community_events', timestamps: false })
export class CommunityEventModel {
  @Prop({ type: Types.ObjectId, ref: 'ClientModel', default: null })
  clientId!: Types.ObjectId | null;

  @Prop({ required: true })
  phoneE164!: string;

  @Prop({
    required: true,
    enum: ['registro', 'visita', 'registro_rechazado'],
  })
  type!: CommunityEventType;

  @Prop({ type: String, default: null })
  rejectReason!: string | null;

  @Prop({ required: true, enum: ['qr', 'nfc'] })
  channel!: CommunityChannel;

  @Prop({ required: true })
  occurredAt!: Date;
}

export const CommunityEventSchema =
  SchemaFactory.createForClass(CommunityEventModel);
CommunityEventSchema.index({ occurredAt: -1 });
CommunityEventSchema.index({ phoneE164: 1 });
CommunityEventSchema.index({ clientId: 1 });
