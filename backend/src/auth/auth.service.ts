import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/usuario.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
import { CompletarPerfilDto } from './dto/completar-perfil.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usuariosRepo.findOne({
      where: {
        documento: loginDto.documento,
        ...(loginDto.tipo_documento && {
          tipo_documento: loginDto.tipo_documento,
        }),
      },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: user.id, documento: user.documento, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        tipo_documento: user.tipo_documento,
        documento: user.documento,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        rol: user.rol,
        primer_inicio: user.primer_inicio,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usuariosRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password, ...result } = user;
    return result;
  }

  async cambiarPassword(userId: string, dto: CambiarPasswordDto) {
    const user = await this.usuariosRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isPasswordValid = await bcrypt.compare(
      dto.password_actual,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    user.password = await bcrypt.hash(dto.password_nuevo, 10);
    user.primer_inicio = false;
    await this.usuariosRepo.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }

  async completarPerfil(userId: string, dto: CompletarPerfilDto) {
    const user = await this.usuariosRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    user.nombre = dto.nombre;
    user.apellido_paterno = dto.apellido_paterno;
    user.apellido_materno = dto.apellido_materno;
    user.celular = dto.celular;
    user.email = dto.email;
    user.direccion = dto.direccion;

    const saved = await this.usuariosRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }
}
