import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, TipoDocumento } from './usuario.entity.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
  ) {}

  private validateDocumento(tipoDocumento: TipoDocumento, documento: string) {
    switch (tipoDocumento) {
      case TipoDocumento.DNI:
        if (!/^\d{8}$/.test(documento)) {
          throw new BadRequestException(
            'El DNI debe tener exactamente 8 dígitos numéricos',
          );
        }
        break;
      case TipoDocumento.CE:
        if (!/^[A-Za-z0-9]{9}$/.test(documento)) {
          throw new BadRequestException(
            'El Carnet de Extranjería debe tener 9 caracteres alfanuméricos',
          );
        }
        break;
      case TipoDocumento.PASAPORTE:
        if (!/^[A-Za-z0-9]{1,12}$/.test(documento)) {
          throw new BadRequestException(
            'El Pasaporte debe tener hasta 12 caracteres alfanuméricos',
          );
        }
        break;
    }
  }

  async findAll() {
    const usuarios = await this.usuariosRepo.find({
      order: { created_at: 'DESC' },
    });
    return usuarios.map(({ password, ...rest }) => rest);
  }

  async findOne(id: string) {
    const user = await this.usuariosRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password, ...result } = user;
    return result;
  }

  async create(dto: CreateUsuarioDto) {
    const tipoDocumento = dto.tipo_documento || TipoDocumento.DNI;
    this.validateDocumento(tipoDocumento, dto.documento);

    const exists = await this.usuariosRepo.findOne({
      where: { documento: dto.documento },
    });
    if (exists) throw new ConflictException('El documento ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.documento, 10);
    const user = this.usuariosRepo.create({
      tipo_documento: tipoDocumento,
      documento: dto.documento,
      password: hashedPassword,
      rol: dto.rol,
      primer_inicio: true,
    });
    const saved = await this.usuariosRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    const user = await this.usuariosRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.tipo_documento && dto.tipo_documento !== user.tipo_documento) {
      this.validateDocumento(dto.tipo_documento, user.documento);
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    const saved = await this.usuariosRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async remove(id: string) {
    const user = await this.usuariosRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usuariosRepo.remove(user);
    return { message: 'Usuario eliminado' };
  }

  async resetPassword(id: string) {
    const user = await this.usuariosRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.password = await bcrypt.hash(user.documento, 10);
    user.primer_inicio = true;
    await this.usuariosRepo.save(user);
    return { message: 'Contraseña reseteada correctamente' };
  }
}
