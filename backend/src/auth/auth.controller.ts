import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
import { CompletarPerfilDto } from './dto/completar-perfil.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cambiar-password')
  async cambiarPassword(@Request() req: any, @Body() dto: CambiarPasswordDto) {
    return this.authService.cambiarPassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('completar-perfil')
  async completarPerfil(@Request() req: any, @Body() dto: CompletarPerfilDto) {
    return this.authService.completarPerfil(req.user.id, dto);
  }
}
