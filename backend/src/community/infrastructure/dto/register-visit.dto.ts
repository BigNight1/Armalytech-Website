import { IsOptional, IsString } from 'class-validator';

export class RegisterVisitDto {
  @IsOptional()
  @IsString()
  phone?: string;
}
