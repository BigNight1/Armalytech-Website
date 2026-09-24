import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CommunityChannel } from '../../domain/client.entity';

export type ClientDocument = HydratedDocument<ClientModel>;

@Schema({ collection: 'clients', timestamps: true })
export class ClientModel {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true })
  phoneE164!: string;

  @Prop({ required: true, default: false })
  marketingConsent!: boolean;

  @Prop({ required: true })
  consentAt!: Date;

  @Prop({ required: true, enum: ['qr', 'nfc', 'manual'] })
  channel!: CommunityChannel;

  @Prop({ required: true, default: 0 })
  visitCount!: number;

  @Prop({ required: true, default: 0 })
  stamps!: number;

  @Prop({ required: true, default: 1 })
  loyaltyCycle!: number;

  @Prop({ required: true, default: 0 })
  rewardsClaimed!: number;

  @Prop({ type: Date, default: null })
  lastRewardClaimedAt?: Date | null;

  @Prop({ type: Date, default: null })
  firstVisitAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastVisitAt?: Date | null;
}

export const ClientSchema = SchemaFactory.createForClass(ClientModel);
ClientSchema.index({ phoneE164: 1 }, { unique: true });
ClientSchema.index({ firstName: 1, lastName: 1 });
