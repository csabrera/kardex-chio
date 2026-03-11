import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFrenteTrabajoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
