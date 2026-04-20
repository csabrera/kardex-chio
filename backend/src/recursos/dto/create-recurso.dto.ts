import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRecursoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  categoria_id: number;

  @IsNumber()
  @IsNotEmpty()
  unidad_medida_id: number;
}
