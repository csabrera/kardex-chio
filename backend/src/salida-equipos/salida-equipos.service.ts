import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalidaEquipo } from './salida-equipo.entity';
import { CreateSalidaEquipoDto } from './dto/create-salida-equipo.dto';

@Injectable()
export class SalidaEquiposService {
  constructor(
    @InjectRepository(SalidaEquipo)
    private salidaEquiposRepo: Repository<SalidaEquipo>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.salidaEquiposRepo
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.equipo', 'eq')
      .leftJoinAndSelect('se.frenteTrabajo', 'ft')
      .leftJoinAndSelect('se.quienEntrega', 'qe')
      .leftJoinAndSelect('se.quienRecibe', 'qr');

    if (query.search) {
      qb.andWhere('(LOWER(eq.nombre) LIKE LOWER(:search) OR LOWER(ft.nombre) LIKE LOWER(:search))', {
        search: `%${query.search}%`,
      });
    }

    if (query.fecha_desde) {
      qb.andWhere('se.fecha >= :desde', { desde: query.fecha_desde });
    }

    if (query.fecha_hasta) {
      qb.andWhere('se.fecha <= :hasta', { hasta: query.fecha_hasta });
    }

    qb.orderBy('se.fecha', 'DESC').addOrderBy('se.id', 'DESC');

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
    const se = await this.salidaEquiposRepo.findOne({
      where: { id },
      relations: ['equipo', 'frenteTrabajo', 'quienEntrega', 'quienRecibe'],
    });
    if (!se) throw new NotFoundException('Salida de equipo no encontrada');
    return se;
  }

  async create(dto: CreateSalidaEquipoDto, userId: string) {
    const se = this.salidaEquiposRepo.create({
      ...dto,
      created_by: userId,
    });
    const saved = await this.salidaEquiposRepo.save(se);

    await this.dataSource.query(
      `INSERT INTO movimientos (tipo, referencia_id, equipo_id, cantidad, fecha, descripcion, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['SALIDA_EQUIPO', saved.id, dto.equipo_id, dto.cantidad, dto.fecha, `${dto.descripcion_trabajo || ''}`, userId],
    );

    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const se = await this.findOne(id);
    await this.salidaEquiposRepo.remove(se);
    return { message: 'Salida de equipo eliminada' };
  }
}
