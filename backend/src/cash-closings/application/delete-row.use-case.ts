import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  CashClosingRepository,
  CASH_CLOSING_REPOSITORY,
} from '../domain/cash-closing-repository.port';
import { BusinessDate } from '../domain/business-date.vo';
import { CashClosingRowNotFoundError } from '../domain/cash-closing.errors';
import { RealtimePublisher } from '../../shared/realtime/realtime-publisher';

@Injectable()
export class DeleteCashClosingRowUseCase {
  constructor(
    @Inject(CASH_CLOSING_REPOSITORY)
    private readonly repository: CashClosingRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(date: string, rowIndex: number): Promise<void> {
    const businessDate = BusinessDate.of(date);
    const deleted = await this.repository.delete(
      businessDate.toString(),
      rowIndex,
    );
    if (!deleted) {
      throw new CashClosingRowNotFoundError(businessDate.toString(), rowIndex);
    }
    this.realtime?.publish('sales');
  }
}
