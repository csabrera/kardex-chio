import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMedioTransporteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
