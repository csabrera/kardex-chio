import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipo } from './equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private equiposRepo: Repository<Equipo>,
  ) {}

  async findAll(query: { search?: string; estado?: string }) {
    const qb = this.equiposRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.categoria', 'c')
      .leftJoinAndSelect('e.unidadMedida', 'um');

    if (query.search) {
      qb.andWhere('LOWER(e.nombre) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.estado) {
      qb.andWhere('e.estado = :estado', { estado: query.estado });
    }

    qb.orderBy('e.nombre', 'ASC');
    return qb.getMany();
  }

  async findOne(id: number) {
    const equipo = await this.equiposRepo.findOne({
      where: { id },
      relations: ['categoria', 'unidadMedida'],
    });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return equipo;
  }

  async create(dto: CreateEquipoDto) {
    const equipo = this.equiposRepo.create(dto);
    return this.equiposRepo.save(equipo);
  }

  async update(id: number, dto: UpdateEquipoDto) {
    const equipo = await this.findOne(id);
    Object.assign(equipo, dto);
    return this.equiposRepo.save(equipo);
  }

  async remove(id: number) {
    const equipo = await this.findOne(id);
    equipo.activo = false;
    await this.equiposRepo.save(equipo);
    return { message: 'Equipo desactivado' };
  }
}
