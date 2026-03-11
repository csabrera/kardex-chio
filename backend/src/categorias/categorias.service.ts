import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriasRepo: Repository<Categoria>,
  ) {}

  findAll() {
    return this.categoriasRepo.find({ order: { nombre: 'ASC' } });
  }

  findActivos() {
    return this.categoriasRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const cat = await this.categoriasRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(nombre: string) {
    const cat = this.categoriasRepo.create({ nombre });
    return this.categoriasRepo.save(cat);
  }

  async update(id: number, data: { nombre?: string; activo?: boolean }) {
    const cat = await this.findOne(id);
    if (data.nombre !== undefined) cat.nombre = data.nombre;
    if (data.activo !== undefined) cat.activo = data.activo;
    return this.categoriasRepo.save(cat);
  }

  async remove(id: number) {
    const cat = await this.findOne(id);
    cat.activo = false;
    await this.categoriasRepo.save(cat);
    return { message: 'Categoría desactivada' };
  }
}
