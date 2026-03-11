import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateEntradaDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @IsOptional()
  num_guia?: string;

  @IsNumber()
  recurso_id: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  @IsOptional()
  quien_entrega_id?: number;

  @IsNumber()
  @IsOptional()
  quien_recibe_id?: number;

  @IsNumber()
  @IsOptional()
  medio_transporte_id?: number;
}
