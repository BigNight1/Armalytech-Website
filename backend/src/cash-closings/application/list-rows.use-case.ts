import { Inject, Injectable } from '@nestjs/common';
import { CashClosingRow } from '../domain/cash-closing-row.entity';
import {
  CashClosingRepository,
  CASH_CLOSING_REPOSITORY,
} from '../domain/cash-closing-repository.port';
import { BusinessDate } from '../domain/business-date.vo';

@Injectable()
export class ListCashClosingRowsUseCase {
  constructor(
    @Inject(CASH_CLOSING_REPOSITORY)
    private readonly repository: CashClosingRepository,
  ) {}

  async execute(from: string, to: string): Promise<CashClosingRow[]> {
    const fromDate = BusinessDate.of(from);
    const toDate = BusinessDate.of(to);
    return this.repository.findByRange(fromDate.toString(), toDate.toString());
  }
}
