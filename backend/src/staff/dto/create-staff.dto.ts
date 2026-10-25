import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña temporal es requerida' })
  @MinLength(8, {
    message: 'La contraseña temporal debe tener al menos 8 caracteres',
  })
  password!: string;
}
