import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class UpdateModelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
