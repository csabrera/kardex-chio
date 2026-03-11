import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Entrada } from './entrada.entity';
import { CreateEntradaDto } from './dto/create-entrada.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class EntradasService {
  constructor(
    @InjectRepository(Entrada)
    private entradasRepo: Repository<Entrada>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoria_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.entradasRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.recurso', 'r')
      .leftJoinAndSelect('r.categoria', 'c')
      .leftJoinAndSelect('e.quienEntrega', 'qe')
      .leftJoinAndSelect('e.quienRecibe', 'qr')
      .leftJoinAndSelect('e.medioTransporte', 'mt');

    if (query.search) {
      qb.andWhere('(LOWER(r.nombre) LIKE LOWER(:search) OR LOWER(e.num_guia) LIKE LOWER(:search))', {
        search: `%${query.search}%`,
      });
    }

    if (query.categoria_id) {
      qb.andWhere('r.categoria_id = :catId', { catId: query.categoria_id });
    }

    if (query.fecha_desde) {
      qb.andWhere('e.fecha >= :desde', { desde: query.fecha_desde });
    }

    if (query.fecha_hasta) {
      qb.andWhere('e.fecha <= :hasta', { hasta: query.fecha_hasta });
    }

    qb.orderBy('e.fecha', 'DESC').addOrderBy('e.id', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const entrada = await this.entradasRepo.findOne({
      where: { id },
      relations: ['recurso', 'recurso.categoria', 'quienEntrega', 'quienRecibe', 'medioTransporte'],
    });
    if (!entrada) throw new NotFoundException('Entrada no encontrada');
    return entrada;
  }

  async create(dto: CreateEntradaDto, userId: string) {
    const entrada = this.entradasRepo.create({
      ...dto,
      created_by: userId,
    });
    const saved = await this.entradasRepo.save(entrada);

    // Register movement for traceability
    await this.dataSource.query(
      `INSERT INTO movimientos (tipo, referencia_id, recurso_id, cantidad, fecha, descripcion, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['ENTRADA', saved.id, dto.recurso_id, dto.cantidad, dto.fecha, `Guía: ${dto.num_guia || 'S/N'}`, userId],
    );

    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const entrada = await this.findOne(id);
    await this.entradasRepo.remove(entrada);
    return { message: 'Entrada eliminada' };
  }
}
