import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class UpdateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
