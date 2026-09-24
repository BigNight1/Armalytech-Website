import { Inject, Injectable } from '@nestjs/common';
import {
  CashClosingRepository,
  CASH_CLOSING_REPOSITORY,
} from '../domain/cash-closing-repository.port';
import { BusinessDate } from '../domain/business-date.vo';
import { roundMoney } from '../../shared/domain/money';
import { ValidationDomainError } from '../../shared/domain/domain-error';

export type SummaryGroupBy = 'day' | 'week' | 'month';

export interface SummaryGroup {
  key: string;
  cashIncome: number;
  yapeIncome: number;
  cashExpense: number;
  yapeExpense: number;
  net: number;
}

@Injectable()
export class GetCashClosingsSummaryUseCase {
  constructor(
    @Inject(CASH_CLOSING_REPOSITORY)
    private readonly repository: CashClosingRepository,
  ) {}

  async execute(
    from: string,
    to: string,
    groupBy: SummaryGroupBy,
  ): Promise<SummaryGroup[]> {
    const fromDate = BusinessDate.of(from);
    const toDate = BusinessDate.of(to);
    if (!['day', 'week', 'month'].includes(groupBy)) {
      throw new ValidationDomainError(`Invalid groupBy "${groupBy}"`);
    }

    const rows = await this.repository.findByRange(
      fromDate.toString(),
      toDate.toString(),
    );
    const groups = new Map<string, SummaryGroup>();

    for (const row of rows) {
      const key = this.groupKey(row.date, groupBy);
      const group =
        groups.get(key) ??
        ({
          key,
          cashIncome: 0,
          yapeIncome: 0,
          cashExpense: 0,
          yapeExpense: 0,
          net: 0,
        } as SummaryGroup);

      group.cashIncome = roundMoney(group.cashIncome + row.cashIncome);
      group.yapeIncome = roundMoney(group.yapeIncome + row.yapeIncome);
      group.cashExpense = roundMoney(group.cashExpense + row.cashExpense);
      group.yapeExpense = roundMoney(group.yapeExpense + row.yapeExpense);
      group.net = roundMoney(
        group.cashIncome +
          group.yapeIncome -
          group.cashExpense -
          group.yapeExpense,
      );

      groups.set(key, group);
    }

    return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  private groupKey(date: string, groupBy: SummaryGroupBy): string {
    if (groupBy === 'day') {
      return date;
    }
    if (groupBy === 'month') {
      return date.slice(0, 7);
    }

    // week: key by the Monday (ISO week start) of the row's date, in UTC
    // calendar terms (Lima has no DST, so plain UTC arithmetic is safe).
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    const isoDayOfWeek = (d.getUTCDay() + 6) % 7; // Monday=0 .. Sunday=6
    d.setUTCDate(d.getUTCDate() - isoDayOfWeek);
    return d.toISOString().slice(0, 10);
  }
}
