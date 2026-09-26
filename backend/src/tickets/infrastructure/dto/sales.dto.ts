import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  @IsString()
  productoId!: string;

  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad!: number;

  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precioUnitario!: number;
}

export class CreateSaleDto {
  @IsArray({ message: 'Los items son obligatorios' })
  @ArrayMinSize(1, { message: 'Debes incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @IsIn(['efectivo', 'yape'], { message: 'El método debe ser efectivo o yape' })
  metodo!: 'efectivo' | 'yape';

  @IsOptional()
  @IsString()
  nota?: string;
}
