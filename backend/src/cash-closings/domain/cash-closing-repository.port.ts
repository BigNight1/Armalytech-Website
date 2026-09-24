import { CashClosingRow } from './cash-closing-row.entity';

export const CASH_CLOSING_REPOSITORY = Symbol('CASH_CLOSING_REPOSITORY');

export interface UpsertCashClosingRowInput {
  cashIncome: number;
  yapeIncome: number;
  incomeDetail: string;
  cashExpense: number;
  yapeExpense: number;
  expenseDetail: string;
}

export interface CashClosingRepository {
  upsert(
    date: string,
    rowIndex: number,
    input: UpsertCashClosingRowInput,
  ): Promise<CashClosingRow>;
  delete(date: string, rowIndex: number): Promise<boolean>;
  findByRange(from: string, to: string): Promise<CashClosingRow[]>;
}
