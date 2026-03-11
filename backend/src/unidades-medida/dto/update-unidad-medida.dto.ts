import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUnidadMedidaDto {
  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
