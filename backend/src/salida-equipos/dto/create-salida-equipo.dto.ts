import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateSalidaEquipoDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @IsOptional()
  num_registro?: string;

  @IsNumber()
  equipo_id: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  @IsOptional()
  frente_trabajo_id?: number;

  @IsString()
  @IsOptional()
  descripcion_trabajo?: string;

  @IsNumber()
  @IsOptional()
  quien_entrega_id?: number;

  @IsNumber()
  @IsOptional()
  quien_recibe_id?: number;
}
