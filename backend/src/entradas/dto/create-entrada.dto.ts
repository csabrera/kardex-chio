import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateEntradaDto {
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida' })
  fecha: string;

  @IsString({ message: 'El número de guía debe ser texto' })
  @IsOptional()
  num_guia?: string;

  @IsNumber({}, { message: 'El recurso es requerido' })
  recurso_id: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  cantidad: number;

  @IsNumber({}, { message: 'Quién entrega no es válido' })
  @IsOptional()
  quien_entrega_id?: number;

  @IsNumber({}, { message: 'Quién recibe no es válido' })
  @IsOptional()
  quien_recibe_id?: number;

  @IsNumber({}, { message: 'El medio de transporte no es válido' })
  @IsOptional()
  medio_transporte_id?: number;
}
