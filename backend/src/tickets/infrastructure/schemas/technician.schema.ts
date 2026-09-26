import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TechnicianDocument = TechnicianModel & Document;

@Schema({ collection: 'tecnicos', timestamps: true })
export class TechnicianModel {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, default: true })
  activo!: boolean;
}

export const TechnicianSchema = SchemaFactory.createForClass(TechnicianModel);
