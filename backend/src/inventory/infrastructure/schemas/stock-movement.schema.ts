import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StockMovementType } from '../../domain/stock-movement.entity';

export type StockMovementDocument = HydratedDocument<StockMovementModel>;

@Schema({ _id: false })
class StockMovementReferenceSchema {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  id!: string;
}

/** Kardex entry (`movimientosStock` in ADR 0006): append-only, never deleted or edited. */
@Schema({ collection: 'stock_movements', timestamps: false })
export class StockMovementModel {
  @Prop({
    type: Types.ObjectId,
    ref: 'ProductModel',
    required: true,
    index: true,
  })
  productId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'venta',
      'venta_anulada',
      'ticket_salida',
      'ticket_devolucion',
      'ajuste_entrada',
      'ajuste_salida',
    ],
  })
  type!: StockMovementType;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  stockAfter!: number;

  @Prop({ type: StockMovementReferenceSchema, default: null })
  reference!: StockMovementReferenceSchema | null;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userEmail!: string;

  @Prop({ required: true })
  occurredAt!: Date;
}

export const StockMovementSchema =
  SchemaFactory.createForClass(StockMovementModel);
StockMovementSchema.index({ productId: 1, occurredAt: -1 });
