import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CashClosingRowModel,
  CashClosingRowSchema,
} from './infrastructure/schemas/cash-closing-row.schema';
import { MongooseCashClosingRepository } from './infrastructure/cash-closing.repository';
import { CashClosingsController } from './infrastructure/cash-closings.controller';
import { CASH_CLOSING_REPOSITORY } from './domain/cash-closing-repository.port';
import { UpsertCashClosingRowUseCase } from './application/upsert-row.use-case';
import { DeleteCashClosingRowUseCase } from './application/delete-row.use-case';
import { ListCashClosingRowsUseCase } from './application/list-rows.use-case';
import { GetCashClosingsSummaryUseCase } from './application/get-summary.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CashClosingRowModel.name, schema: CashClosingRowSchema },
    ]),
  ],
  controllers: [CashClosingsController],
  providers: [
    {
      provide: CASH_CLOSING_REPOSITORY,
      useClass: MongooseCashClosingRepository,
    },
    UpsertCashClosingRowUseCase,
    DeleteCashClosingRowUseCase,
    ListCashClosingRowsUseCase,
    GetCashClosingsSummaryUseCase,
  ],
})
export class CashClosingsModule {}
