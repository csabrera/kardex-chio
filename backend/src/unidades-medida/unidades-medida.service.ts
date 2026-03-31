import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnidadMedida } from './unidad-medida.entity';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';

@Injectable()
export class UnidadesMedidaService {
  constructor(
    @InjectRepository(UnidadMedida)
    private unidadesMedidaRepo: Repository<UnidadMedida>,
  ) {}

  findAll() {
    return this.unidadesMedidaRepo.find({ order: { nombre: 'ASC' } });
  }

  findActivos() {
    return this.unidadesMedidaRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const unidad = await this.unidadesMedidaRepo.findOne({ where: { id } });
    if (!unidad) throw new NotFoundException('Unidad de medida no encontrada');
    return unidad;
  }

  async create(dto: CreateUnidadMedidaDto) {
    const existe = await this.unidadesMedidaRepo.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe)
      throw new ConflictException(
        'El código de unidad de medida ya está registrado',
      );
    const unidad = this.unidadesMedidaRepo.create(dto);
    return this.unidadesMedidaRepo.save(unidad);
  }

  async update(id: number, dto: UpdateUnidadMedidaDto) {
    const unidad = await this.findOne(id);
    if (dto.codigo && dto.codigo !== unidad.codigo) {
      const existe = await this.unidadesMedidaRepo.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe)
        throw new ConflictException(
          'El código de unidad de medida ya está registrado',
        );
    }
    Object.assign(unidad, dto);
    return this.unidadesMedidaRepo.save(unidad);
  }

  async remove(id: number) {
    const unidad = await this.findOne(id);
    unidad.activo = false;
    await this.unidadesMedidaRepo.save(unidad);
    return { message: 'Unidad de medida desactivada' };
  }
}
