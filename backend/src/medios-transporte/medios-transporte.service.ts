import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedioTransporte } from './medio-transporte.entity';
import { CreateMedioTransporteDto } from './dto/create-medio-transporte.dto';
import { UpdateMedioTransporteDto } from './dto/update-medio-transporte.dto';

@Injectable()
export class MediosTransporteService {
  constructor(
    @InjectRepository(MedioTransporte)
    private mediosTransporteRepo: Repository<MedioTransporte>,
  ) {}

  findAll() {
    return this.mediosTransporteRepo.find({ order: { nombre: 'ASC' } });
  }

  findActivos() {
    return this.mediosTransporteRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const medio = await this.mediosTransporteRepo.findOne({ where: { id } });
    if (!medio) throw new NotFoundException('Medio de transporte no encontrado');
    return medio;
  }

  async create(dto: CreateMedioTransporteDto) {
    const exists = await this.mediosTransporteRepo.findOne({ where: { nombre: dto.nombre } });
    if (exists) throw new ConflictException('Ya existe un medio de transporte con ese nombre');

    const medio = this.mediosTransporteRepo.create(dto);
    return this.mediosTransporteRepo.save(medio);
  }

  async update(id: number, dto: UpdateMedioTransporteDto) {
    const medio = await this.findOne(id);

    if (dto.nombre && dto.nombre !== medio.nombre) {
      const exists = await this.mediosTransporteRepo.findOne({ where: { nombre: dto.nombre } });
      if (exists) throw new ConflictException('Ya existe un medio de transporte con ese nombre');
    }

    Object.assign(medio, dto);
    return this.mediosTransporteRepo.save(medio);
  }

  async remove(id: number) {
    const medio = await this.findOne(id);
    medio.activo = false;
    await this.mediosTransporteRepo.save(medio);
    return { message: 'Medio de transporte desactivado' };
  }
}
