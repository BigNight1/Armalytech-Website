import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CashClosingRow } from '../domain/cash-closing-row.entity';
import {
  CashClosingRepository,
  UpsertCashClosingRowInput,
} from '../domain/cash-closing-repository.port';
import {
  CashClosingRowDocument,
  CashClosingRowModel,
} from './schemas/cash-closing-row.schema';

@Injectable()
export class MongooseCashClosingRepository implements CashClosingRepository {
  constructor(
    @InjectModel(CashClosingRowModel.name)
    private readonly model: Model<CashClosingRowDocument>,
  ) {}

  async upsert(
    date: string,
    rowIndex: number,
    input: UpsertCashClosingRowInput,
  ): Promise<CashClosingRow> {
    const doc = await this.model
      .findOneAndUpdate(
        { date, rowIndex },
        { $set: { ...input, date, rowIndex } },
        { new: true, upsert: true },
      )
      .exec();
    return this.toEntity(doc!);
  }

  async delete(date: string, rowIndex: number): Promise<boolean> {
    const result = await this.model.deleteOne({ date, rowIndex }).exec();
    return result.deletedCount > 0;
  }

  async findByRange(from: string, to: string): Promise<CashClosingRow[]> {
    const docs = await this.model
      .find({ date: { $gte: from, $lte: to } })
      .sort({ date: 1, rowIndex: 1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  private toEntity(doc: CashClosingRowDocument): CashClosingRow {
    return {
      id: doc._id.toString(),
      date: doc.date,
      rowIndex: doc.rowIndex,
      cashIncome: doc.cashIncome,
      yapeIncome: doc.yapeIncome,
      incomeDetail: doc.incomeDetail,
      cashExpense: doc.cashExpense,
      yapeExpense: doc.yapeExpense,
      expenseDetail: doc.expenseDetail,
    };
  }
}
