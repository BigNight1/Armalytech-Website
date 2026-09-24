import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PartDocument = HydratedDocument<PartModel>;

/** Mirrors the SQLite `parts` table (model_id, name, quantity, purchase_price, sale_price). */
@Schema({ collection: 'parts', timestamps: true })
export class PartModel {
  @Prop({
    type: Types.ObjectId,
    ref: 'InventoryModelSchemaClass',
    required: true,
    index: true,
  })
  modelId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, default: 0 })
  quantity!: number;

  @Prop({ required: true, default: 0 })
  purchasePrice!: number;

  @Prop({ required: true, default: 0 })
  salePrice!: number;
}

export const PartSchema = SchemaFactory.createForClass(PartModel);
PartSchema.index({ modelId: 1, name: 1 });
PartSchema.index({ name: 'text' });
