import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CobroDocument = CobroModel & Document;

@Schema({ _id: false })
export class CobroItemModel {
  @Prop({ required: true })
  productoId!: string;

  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true, min: 1 })
  cantidad!: number;

  @Prop({ required: true, min: 0 })
  precioUnitario!: number;

  @Prop({ required: false, default: 0 })
  costoUnitario?: number;
}

export const CobroItemSchema = SchemaFactory.createForClass(CobroItemModel);

@Schema({ collection: 'cobros', timestamps: true })
export class CobroModel {
  @Prop({ required: true, enum: ['ticket', 'venta'] })
  origen!: 'ticket' | 'venta';

  @Prop({ required: true, index: true })
  referenciaId!: string; // ticket _id o venta id

  @Prop({ required: true, index: true })
  codigo!: string; // AT-000148 (display code) o código de venta

  @Prop({ required: true, enum: ['adelanto', 'saldo', 'venta'] })
  tipo!: 'adelanto' | 'saldo' | 'venta';

  @Prop({ required: true, min: 0 })
  monto!: number;

  @Prop({ required: true, enum: ['efectivo', 'yape'] })
  metodo!: 'efectivo' | 'yape';

  @Prop({ required: true, default: Date.now, index: true })
  fecha!: Date;

  @Prop({ required: false })
  usuarioId?: string;

  @Prop({ required: false })
  descripcion?: string;

  @Prop({ required: true, default: false, index: true })
  anulado!: boolean;

  @Prop({ required: false })
  anuladoPor?: string;

  @Prop({ required: false })
  anuladoAt?: Date;

  @Prop({ required: false })
  motivoAnulacion?: string;

  @Prop({ type: [CobroItemSchema], default: undefined })
  items?: CobroItemModel[];
}

export const CobroSchema = SchemaFactory.createForClass(CobroModel);
CobroSchema.index({ fecha: -1 });
CobroSchema.index({ origen: 1, referenciaId: 1 });
