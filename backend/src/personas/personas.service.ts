import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona, PersonaTipo } from './persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private personasRepo: Repository<Persona>,
  ) {}

  findAll(tipo?: string) {
    const where: any = {};
    if (tipo) where.tipo = tipo as PersonaTipo;
    return this.personasRepo.find({ where, order: { nombre: 'ASC' } });
  }

  findActivos(tipo?: string) {
    const where: any = { activo: true };
    if (tipo) where.tipo = tipo as PersonaTipo;
    return this.personasRepo.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const persona = await this.personasRepo.findOne({ where: { id } });
    if (!persona) throw new NotFoundException('Persona no encontrada');
    return persona;
  }

  async create(dto: CreatePersonaDto) {
    const persona = this.personasRepo.create(dto);
    return this.personasRepo.save(persona);
  }

  async update(id: number, dto: UpdatePersonaDto) {
    const persona = await this.findOne(id);
    Object.assign(persona, dto);
    return this.personasRepo.save(persona);
  }

  async remove(id: number) {
    const persona = await this.findOne(id);
    persona.activo = false;
    await this.personasRepo.save(persona);
    return { message: 'Persona desactivada' };
  }
}
