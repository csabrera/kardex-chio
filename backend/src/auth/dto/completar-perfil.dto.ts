import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches, MaxLength } from 'class-validator';

export class CompletarPerfilDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido paterno es obligatorio' })
  @MaxLength(100)
  apellido_paterno: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido materno es obligatorio' })
  @MaxLength(100)
  apellido_materno: string;

  @IsString()
  @IsNotEmpty({ message: 'El celular es obligatorio' })
  @Matches(/^9\d{8}$/, { message: 'El celular debe ser un número peruano de 9 dígitos que empiece con 9' })
  celular: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(300)
  direccion: string;
}
