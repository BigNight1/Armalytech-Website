import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { UpsertCashClosingRowUseCase } from '../application/upsert-row.use-case';
import { DeleteCashClosingRowUseCase } from '../application/delete-row.use-case';
import { ListCashClosingRowsUseCase } from '../application/list-rows.use-case';
import { GetCashClosingsSummaryUseCase } from '../application/get-summary.use-case';
import {
  SummaryQueryDto,
  UpsertCashClosingRowDto,
} from './dto/cash-closing-row.dto';

@Controller('cash-closings')
export class CashClosingsController {
  constructor(
    private readonly upsertRow: UpsertCashClosingRowUseCase,
    private readonly deleteRow: DeleteCashClosingRowUseCase,
    private readonly listRows: ListCashClosingRowsUseCase,
    private readonly getSummary: GetCashClosingsSummaryUseCase,
  ) {}

  @Get()
  async list(@Query('from') from: string, @Query('to') to: string) {
    return { ok: true, data: await this.listRows.execute(from, to) };
  }

  @Get('summary')
  async summary(@Query() query: SummaryQueryDto) {
    return {
      ok: true,
      data: await this.getSummary.execute(query.from, query.to, query.groupBy),
    };
  }

  @Put(':date/rows/:rowIndex')
  @HttpCode(HttpStatus.OK)
  async upsert(
    @Param('date') date: string,
    @Param('rowIndex', ParseIntPipe) rowIndex: number,
    @Body() dto: UpsertCashClosingRowDto,
  ) {
    return {
      ok: true,
      data: await this.upsertRow.execute(date, rowIndex, {
        cashIncome: dto.cashIncome,
        yapeIncome: dto.yapeIncome,
        incomeDetail: dto.incomeDetail ?? '',
        cashExpense: dto.cashExpense,
        yapeExpense: dto.yapeExpense,
        expenseDetail: dto.expenseDetail ?? '',
      }),
    };
  }

  @Delete(':date/rows/:rowIndex')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('date') date: string,
    @Param('rowIndex', ParseIntPipe) rowIndex: number,
  ): Promise<void> {
    await this.deleteRow.execute(date, rowIndex);
  }
}
