import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @IsNotEmpty()
  password_actual: string;

  @IsString()
  @MinLength(6)
  password_nuevo: string;
}
