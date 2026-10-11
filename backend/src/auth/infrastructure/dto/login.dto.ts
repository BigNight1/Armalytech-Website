import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
