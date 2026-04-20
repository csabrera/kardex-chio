import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateSalidaDto {
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida' })
  fecha: string;

  @IsString({ message: 'El número de registro debe ser texto' })
  @IsOptional()
  num_registro?: string;

  @IsNumber({}, { message: 'El recurso es requerido' })
  recurso_id: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  cantidad: number;

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
