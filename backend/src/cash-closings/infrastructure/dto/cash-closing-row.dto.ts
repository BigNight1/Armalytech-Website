import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpsertCashClosingRowDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cashIncome!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yapeIncome!: number;

  @IsOptional()
  @IsString()
  incomeDetail?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cashExpense!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yapeExpense!: number;

  @IsOptional()
  @IsString()
  expenseDetail?: string;
}

export class SummaryQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to!: string;

  @IsIn(['day', 'week', 'month'])
  groupBy!: 'day' | 'week' | 'month';
}
