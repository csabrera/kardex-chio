import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { TipoDocumento } from '../../usuarios/usuario.entity.js';

export class LoginDto {
  @IsEnum(TipoDocumento)
  @IsOptional()
  tipo_documento?: TipoDocumento;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
