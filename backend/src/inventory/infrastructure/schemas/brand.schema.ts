import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<BrandModel>;

@Schema({ collection: 'brands', timestamps: true })
export class BrandModel {
  @Prop({ required: true, trim: true })
  name!: string;

  /** Lowercased mirror of `name`, used for a case-insensitive unique index. */
  @Prop({ required: true, trim: true, lowercase: true })
  nameLower!: string;
}

export const BrandSchema = SchemaFactory.createForClass(BrandModel);
BrandSchema.index({ nameLower: 1 }, { unique: true });
