import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from './movimiento.entity';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private movimientosRepo: Repository<Movimiento>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    tipo?: string;
    recurso_id?: number;
    equipo_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.movimientosRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.recurso', 'r')
      .leftJoinAndSelect('m.equipo', 'eq')
      .leftJoinAndSelect('m.creator', 'u');

    if (query.tipo) {
      qb.andWhere('m.tipo = :tipo', { tipo: query.tipo });
    }

    if (query.recurso_id) {
      qb.andWhere('m.recurso_id = :recursoId', { recursoId: query.recurso_id });
    }

    if (query.equipo_id) {
      qb.andWhere('m.equipo_id = :equipoId', { equipoId: query.equipo_id });
    }

    if (query.fecha_desde) {
      qb.andWhere('m.fecha >= :desde', { desde: query.fecha_desde });
    }

    if (query.fecha_hasta) {
      qb.andWhere('m.fecha <= :hasta', { hasta: query.fecha_hasta });
    }

    qb.orderBy('m.fecha', 'DESC').addOrderBy('m.id', 'DESC');

    // Select only needed fields from creator (exclude password)
    qb.addSelect(['u.id', 'u.nombre', 'u.documento']);

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
}
