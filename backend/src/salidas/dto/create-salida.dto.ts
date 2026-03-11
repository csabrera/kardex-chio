import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateSalidaDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @IsOptional()
  num_registro?: string;

  @IsNumber()
  recurso_id: number;

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
