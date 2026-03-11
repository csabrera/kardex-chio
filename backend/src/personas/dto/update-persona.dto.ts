import { IsString, IsOptional, IsEnum, IsEmail, IsBoolean } from 'class-validator';
import { PersonaTipo } from '../persona.entity';

export class UpdatePersonaDto {
  @IsEnum(PersonaTipo)
  @IsOptional()
  tipo?: PersonaTipo;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  documento?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
