import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMedioTransporteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
