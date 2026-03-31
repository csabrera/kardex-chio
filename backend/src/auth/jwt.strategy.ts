import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'kardexchio_jwt_secret'),
    });
  }

  async validate(payload: { sub: string; documento: string; rol: string }) {
    const user = await this.usuariosRepo.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }
    return {
      id: user.id,
      tipo_documento: user.tipo_documento,
      documento: user.documento,
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno,
      rol: user.rol,
    };
  }
}
