import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<ProductModel>;

/** Replaces `parts`: an accessory or a model-dependent item (ADR 0006, 2026-09-25 update). */
@Schema({ collection: 'products', timestamps: true })
export class ProductModel {
  @Prop({
    type: Types.ObjectId,
    ref: 'CategoryModel',
    required: true,
    index: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BrandModel', default: null })
  brandId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  model?: string;

  @Prop({ required: true, default: 0 })
  stock!: number;

  @Prop({ required: true, default: 0 })
  cost!: number;

  @Prop({ required: true, default: 0 })
  salePrice!: number;

  @Prop({ required: true, default: 0 })
  minStock!: number;

  @Prop({ type: [Types.ObjectId], ref: 'PhoneModel', default: [] })
  compatiblePhoneIds!: Types.ObjectId[];

  @Prop({ required: true, default: true, index: true })
  active!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
ProductSchema.index({ name: 'text', model: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ compatiblePhoneIds: 1 });
