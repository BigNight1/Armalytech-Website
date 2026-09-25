import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<CategoryModel>;

@Schema({ collection: 'categories', timestamps: true })
export class CategoryModel {
  @Prop({ required: true, trim: true })
  name!: string;

  /** Lowercased mirror of `name`, used for a case-insensitive unique index. */
  @Prop({ required: true, trim: true, lowercase: true })
  nameLower!: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
CategorySchema.index({ nameLower: 1 }, { unique: true });
