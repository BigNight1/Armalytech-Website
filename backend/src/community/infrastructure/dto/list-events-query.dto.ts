import { IsIn, IsISO8601, IsOptional } from 'class-validator';

export class ListEventsQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(['registro', 'visita', 'registro_rechazado'])
  type?: 'registro' | 'visita' | 'registro_rechazado';
}
