import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PhoneDocument = HydratedDocument<PhoneModel>;

/**
 * Compatibility catalog (was `models` pre-v2, collection renamed to
 * `phones`): carries no stock, only `{brandId, name}`.
 */
@Schema({ collection: 'phones', timestamps: true })
export class PhoneModel {
  @Prop({
    type: Types.ObjectId,
    ref: 'BrandModel',
    required: true,
    index: true,
  })
  brandId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  /** Lowercased mirror of `name`, used for a case-insensitive unique index per brand. */
  @Prop({ required: true, trim: true, lowercase: true })
  nameLower!: string;
}

export const PhoneSchema = SchemaFactory.createForClass(PhoneModel);
PhoneSchema.index({ brandId: 1, nameLower: 1 }, { unique: true });
