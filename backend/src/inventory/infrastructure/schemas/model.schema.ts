import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryModelDocument =
  HydratedDocument<InventoryModelSchemaClass>;

/**
 * Named `InventoryModelSchemaClass` to avoid clashing with Mongoose's own
 * `Model<T>` type and with the domain `InventoryModel` entity. Mirrors the
 * SQLite `models` table (brand_id, name) from the desktop app.
 */
@Schema({ collection: 'models', timestamps: true })
export class InventoryModelSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: 'BrandModel',
    required: true,
    index: true,
  })
  brandId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;
}

export const InventoryModelSchema = SchemaFactory.createForClass(
  InventoryModelSchemaClass,
);
InventoryModelSchema.index({ brandId: 1, name: 1 });
