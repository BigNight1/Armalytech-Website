import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListPhonesQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;
}

export class CreatePhoneDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class UpdatePhoneDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brandId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;
}

export class ResolvePhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MaxLength(200)
  marca!: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  @MaxLength(200)
  modelo!: string;
}
