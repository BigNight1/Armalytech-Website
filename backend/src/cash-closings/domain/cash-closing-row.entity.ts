export interface CashClosingRow {
  id: string;
  date: string;
  rowIndex: number;
  cashIncome: number;
  yapeIncome: number;
  incomeDetail: string;
  cashExpense: number;
  yapeExpense: number;
  expenseDetail: string;
}

export type CashClosingRowInput = Omit<CashClosingRow, 'id'>;
