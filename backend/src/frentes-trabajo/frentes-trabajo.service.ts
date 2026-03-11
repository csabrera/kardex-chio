import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FrenteTrabajo } from './frente-trabajo.entity';
import { CreateFrenteTrabajoDto } from './dto/create-frente-trabajo.dto';
import { UpdateFrenteTrabajoDto } from './dto/update-frente-trabajo.dto';

@Injectable()
export class FrentesTrabajoService {
  constructor(
    @InjectRepository(FrenteTrabajo)
    private frentesTrabajoRepo: Repository<FrenteTrabajo>,
  ) {}

  findAll() {
    return this.frentesTrabajoRepo.find({ order: { nombre: 'ASC' } });
  }

  findActivos() {
    return this.frentesTrabajoRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const frente = await this.frentesTrabajoRepo.findOne({ where: { id } });
    if (!frente) throw new NotFoundException('Frente de trabajo no encontrado');
    return frente;
  }

  async create(dto: CreateFrenteTrabajoDto) {
    const exists = await this.frentesTrabajoRepo.findOne({ where: { codigo: dto.codigo } });
    if (exists) throw new ConflictException('El código ya está registrado');

    const frente = this.frentesTrabajoRepo.create(dto);
    return this.frentesTrabajoRepo.save(frente);
  }

  async update(id: number, dto: UpdateFrenteTrabajoDto) {
    const frente = await this.findOne(id);

    if (dto.codigo && dto.codigo !== frente.codigo) {
      const exists = await this.frentesTrabajoRepo.findOne({ where: { codigo: dto.codigo } });
      if (exists) throw new ConflictException('El código ya está registrado');
    }

    Object.assign(frente, dto);
    return this.frentesTrabajoRepo.save(frente);
  }

  async remove(id: number) {
    const frente = await this.findOne(id);
    frente.activo = false;
    await this.frentesTrabajoRepo.save(frente);
    return { message: 'Frente de trabajo desactivado' };
  }
}
