import {
  IsString, IsNumber, IsOptional, IsIn, IsPositive, ValidateIf,
} from 'class-validator';

export class CreateEntradaEquipoDto {
  @IsString({ message: 'El tipo de entrada es requerido' })
  @IsIn(['ADQUISICION', 'RETORNO'], { message: 'El tipo de entrada debe ser ADQUISICION o RETORNO' })
  tipo_entrada: string;

  @IsNumber({}, { message: 'El equipo es requerido' })
  @IsPositive({ message: 'El equipo no es válido' })
  equipo_id: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ValidateIf((o) => o.tipo_entrada === 'RETORNO')
  @IsNumber({}, { message: 'Debe seleccionar la salida de origen para un retorno' })
  salida_equipo_id?: number;

  @IsNumber({}, { message: 'El frente de trabajo no es válido' })
  @IsOptional()
  frente_trabajo_id?: number;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  descripcion_trabajo?: string;

  @IsNumber({}, { message: 'Quién entrega no es válido' })
  @IsOptional()
  quien_entrega_id?: number;

  @IsNumber({}, { message: 'Quién recibe no es válido' })
  @IsOptional()
  quien_recibe_id?: number;
}
