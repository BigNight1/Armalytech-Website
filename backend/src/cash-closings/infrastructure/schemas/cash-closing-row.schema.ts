import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CashClosingRowDocument = HydratedDocument<CashClosingRowModel>;

/** Mirrors the SQLite `cierre_dia` table, unique on (fecha, fila_index). */
@Schema({ collection: 'cash_closing_rows', timestamps: true })
export class CashClosingRowModel {
  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  rowIndex!: number;

  @Prop({ required: true, default: 0 })
  cashIncome!: number;

  @Prop({ required: true, default: 0 })
  yapeIncome!: number;

  @Prop({ required: true, default: '' })
  incomeDetail!: string;

  @Prop({ required: true, default: 0 })
  cashExpense!: number;

  @Prop({ required: true, default: 0 })
  yapeExpense!: number;

  @Prop({ required: true, default: '' })
  expenseDetail!: string;
}

export const CashClosingRowSchema =
  SchemaFactory.createForClass(CashClosingRowModel);
CashClosingRowSchema.index({ date: 1, rowIndex: 1 }, { unique: true });
