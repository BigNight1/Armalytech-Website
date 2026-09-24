import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsBoolean()
  marketingConsent!: boolean;
}

export class RegisterChannelQueryDto {
  @IsOptional()
  @IsIn(['qr', 'nfc'])
  canal?: 'qr' | 'nfc';
}
