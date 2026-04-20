import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateEquipoDto {
  @IsString({ message: 'El nombre es requerido' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre: string;

  @IsNumber({}, { message: 'La categoría no es válida' })
  @IsOptional()
  categoria_id?: number;

  @IsNumber({}, { message: 'La unidad de medida no es válida' })
  @IsOptional()
  unidad_medida_id?: number;

  @IsNumber({}, { message: 'La cantidad inicial debe ser un número' })
  @Min(1, { message: 'La cantidad inicial debe ser al menos 1' })
  cantidad_inicial: number;
}
