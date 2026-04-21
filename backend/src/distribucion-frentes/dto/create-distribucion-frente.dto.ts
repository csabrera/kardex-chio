import { IsNumber, IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateDistribucionFrenteDto {
  @IsNumber()
  @IsNotEmpty()
  recurso_id: number;

  @IsNumber()
  @IsNotEmpty()
  frente_trabajo_id: number;

  @IsNumber()
  @IsNotEmpty()
  cantidad: number;

  @IsUUID()
  @IsNotEmpty()
  responsable_id: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
