import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Equipo, EquipoEstado } from './equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { CodeGenerator } from '../common/utils/code-generator';
import { Categoria } from '../categorias/categoria.entity';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private equiposRepo: Repository<Equipo>,
    @InjectRepository(Categoria)
    private categoriasRepo: Repository<Categoria>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: { page?: number; limit?: number; search?: string; estado?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

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

    const total = await qb.getCount();
    const data = await qb.skip(offset).take(limit).getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const equipo = await this.equiposRepo.findOne({
      where: { id },
      relations: ['categoria', 'unidadMedida'],
    });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return equipo;
  }

  async getCodigoPreview(
    nombre: string,
    categoria_id?: number,
  ): Promise<{ preview: string; nextNumber: number }> {
    if (!nombre) {
      return { preview: '', nextNumber: 0 };
    }

    let categoriaNombre = 'SIN';
    if (categoria_id) {
      const categoria = await this.categoriasRepo.findOne({
        where: { id: categoria_id },
      });
      if (categoria) {
        categoriaNombre = categoria.nombre;
      }
    }

    const codePreview = CodeGenerator.generateCodePreview(
      nombre,
      categoriaNombre,
    );
    const nextNumber = await this.getNextCodigoNumber(nombre, categoriaNombre);

    return {
      preview: `E-${codePreview}-${String(nextNumber).padStart(3, '0')}`,
      nextNumber,
    };
  }

  private async getNextCodigoNumber(
    nombreEquipo: string,
    categoriaNombre: string,
  ): Promise<number> {
    const nombrePart = CodeGenerator.getFirstLetters(nombreEquipo);
    const categoriaPart = CodeGenerator.getFirstLetters(categoriaNombre);
    const prefijo = `${nombrePart}-${categoriaPart}`;

    const result = await this.dataSource.query(
      `SELECT codigo FROM equipos WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,
      [`${prefijo}%`],
    );

    if (!result.length) return 1;

    const lastCodigo = result[0].codigo;
    const numberPart = lastCodigo.split('-').pop();
    const nextNumber = parseInt(numberPart || '0') + 1;
    return nextNumber;
  }

  async create(dto: CreateEquipoDto) {
    let categoriaNombre = 'SIN';
    if (dto.categoria_id) {
      const categoria = await this.categoriasRepo.findOne({
        where: { id: dto.categoria_id },
      });
      if (categoria) {
        categoriaNombre = categoria.nombre;
      }
    }

    const codePreview = CodeGenerator.generateCodePreview(
      dto.nombre,
      categoriaNombre,
    );
    const nextNumber = await this.getNextCodigoNumber(
      dto.nombre,
      categoriaNombre,
    );
    const codigoFinal = `E-${codePreview}-${String(nextNumber).padStart(3, '0')}`;

    const codigoExists = await this.equiposRepo.findOne({
      where: { codigo: codigoFinal } as any,
    });
    if (codigoExists) {
      throw new BadRequestException(
        `El código ${codigoFinal} ya existe en el sistema`,
      );
    }

    const equipo = this.equiposRepo.create({
      ...dto,
      codigo: codigoFinal,
      estado: EquipoEstado.EN_ALMACEN,
    });
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
