import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserRole, TipoDocumento } from '../usuario.entity.js';

export class CreateUsuarioDto {
  @IsEnum(TipoDocumento)
  @IsOptional()
  tipo_documento?: TipoDocumento;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsEnum(UserRole)
  @IsOptional()
  rol?: UserRole;
}
