import { IsNumber, IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateDevolucionDto {
  @IsNumber()
  @IsNotEmpty()
  distribucion_frente_id: number;

  @IsNumber()
  @IsNotEmpty()
  cantidad_devuelta: number;

  @IsUUID()
  @IsNotEmpty()
  quien_devuelve_id: string;

  @IsEnum(['BUENO', 'DAÑADO', 'PARCIAL'])
  @IsOptional()
  estado?: 'BUENO' | 'DAÑADO' | 'PARCIAL';

  @IsString()
  @IsOptional()
  observaciones?: string;
}
