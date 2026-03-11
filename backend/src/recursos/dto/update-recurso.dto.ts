import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateRecursoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  unidad_medida_id?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
