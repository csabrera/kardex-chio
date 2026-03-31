import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EntradaEquipo } from './entrada-equipo.entity';
import { CreateEntradaEquipoDto } from './dto/create-entrada-equipo.dto';

@Injectable()
export class EntradaEquiposService {
  constructor(
    @InjectRepository(EntradaEquipo)
    private entradaEquiposRepo: Repository<EntradaEquipo>,
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

    const qb = this.entradaEquiposRepo
      .createQueryBuilder('ee')
      .leftJoinAndSelect('ee.equipo', 'eq')
      .leftJoinAndSelect('ee.frenteTrabajo', 'ft')
      .leftJoinAndSelect('ee.quienEntrega', 'qe')
      .leftJoinAndSelect('ee.quienRecibe', 'qr');

    if (query.search) {
      qb.andWhere(
        '(LOWER(eq.nombre) LIKE LOWER(:search) OR LOWER(ft.nombre) LIKE LOWER(:search))',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.fecha_desde) {
      qb.andWhere('ee.fecha >= :desde', { desde: query.fecha_desde });
    }

    if (query.fecha_hasta) {
      qb.andWhere('ee.fecha <= :hasta', { hasta: query.fecha_hasta });
    }

    qb.orderBy('ee.fecha', 'DESC').addOrderBy('ee.id', 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const ee = await this.entradaEquiposRepo.findOne({
      where: { id },
      relations: ['equipo', 'frenteTrabajo', 'quienEntrega', 'quienRecibe'],
    });
    if (!ee) throw new NotFoundException('Entrada de equipo no encontrada');
    return ee;
  }

  async create(dto: CreateEntradaEquipoDto, userId: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const ee = manager.create(EntradaEquipo, {
        ...dto,
        created_by: userId,
      });
      const savedEe = await manager.save(ee);

      // Actualizar estado del equipo a EN_ALMACEN
      await manager.query(
        `UPDATE equipos SET estado = 'EN_ALMACEN', updated_at = NOW() WHERE id = $1`,
        [dto.equipo_id],
      );

      // Registrar movimiento de auditoría
      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, equipo_id, cantidad, fecha, descripcion, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'ENTRADA_EQUIPO',
          savedEe.id,
          dto.equipo_id,
          dto.cantidad,
          dto.fecha,
          `${dto.descripcion_trabajo || ''}`,
          userId,
        ],
      );

      return savedEe;
    });

    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const ee = await this.findOne(id);
    await this.entradaEquiposRepo.remove(ee);
    return { message: 'Entrada de equipo eliminada' };
  }
}
