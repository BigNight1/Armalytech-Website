import { Inject, Injectable } from '@nestjs/common';
import { CashClosingRow } from '../domain/cash-closing-row.entity';
import {
  CashClosingRepository,
  CASH_CLOSING_REPOSITORY,
  UpsertCashClosingRowInput,
} from '../domain/cash-closing-repository.port';
import { BusinessDate } from '../domain/business-date.vo';
import { roundMoney } from '../../shared/domain/money';

@Injectable()
export class UpsertCashClosingRowUseCase {
  constructor(
    @Inject(CASH_CLOSING_REPOSITORY)
    private readonly repository: CashClosingRepository,
  ) {}

  async execute(
    date: string,
    rowIndex: number,
    input: UpsertCashClosingRowInput,
  ): Promise<CashClosingRow> {
    const businessDate = BusinessDate.of(date);

    return this.repository.upsert(businessDate.toString(), rowIndex, {
      cashIncome: roundMoney(input.cashIncome),
      yapeIncome: roundMoney(input.yapeIncome),
      incomeDetail: input.incomeDetail,
      cashExpense: roundMoney(input.cashExpense),
      yapeExpense: roundMoney(input.yapeExpense),
      expenseDetail: input.expenseDetail,
    });
  }
}
