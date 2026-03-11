import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { EquipoEstado } from '../equipo.entity';

export class UpdateEquipoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  unidad_medida_id?: number;

  @IsEnum(EquipoEstado)
  @IsOptional()
  estado?: EquipoEstado;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
