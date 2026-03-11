import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRecursoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  categoria_id: number;

  @IsNumber()
  unidad_medida_id: number;
}
