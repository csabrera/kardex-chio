import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EquipoEstado } from '../equipo.entity';

export class CreateEquipoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  unidad_medida_id?: number;

  @IsEnum(EquipoEstado)
  @IsOptional()
  estado?: EquipoEstado;
}
