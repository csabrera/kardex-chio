import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { PersonaTipo } from '../persona.entity';

export class CreatePersonaDto {
  @IsEnum(PersonaTipo)
  @IsNotEmpty()
  tipo: PersonaTipo;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  documento?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}
