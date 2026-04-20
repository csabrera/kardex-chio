import {
  IsString, IsNumber, IsOptional, IsIn, IsPositive,
} from 'class-validator';

export class CreateSalidaEquipoDto {
  @IsString({ message: 'El tipo de salida es requerido' })
  @IsIn(['PRESTAMO', 'ASIGNACION'], { message: 'El tipo de salida debe ser PRESTAMO o ASIGNACION' })
  tipo_salida: string;

  @IsNumber({}, { message: 'El equipo es requerido' })
  @IsPositive({ message: 'El equipo no es válido' })
  equipo_id: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsNumber({}, { message: 'El frente de trabajo es requerido' })
  frente_trabajo_id: number;

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
