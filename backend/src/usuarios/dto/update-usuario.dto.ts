import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  IsEmail,
  Matches,
  MaxLength,
} from 'class-validator';
import { UserRole, TipoDocumento } from '../usuario.entity.js';

export class UpdateUsuarioDto {
  @IsEnum(TipoDocumento)
  @IsOptional()
  tipo_documento?: TipoDocumento;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido_paterno?: string;

  @IsString()
  @IsOptional()
  apellido_materno?: string;

  @IsString()
  @Matches(/^9\d{8}$/, {
    message: 'El celular debe ser un número peruano de 9 dígitos',
  })
  @IsOptional()
  celular?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  direccion?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  rol?: UserRole;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsBoolean()
  @IsOptional()
  primer_inicio?: boolean;
}
