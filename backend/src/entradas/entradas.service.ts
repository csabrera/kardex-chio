import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Entrada } from './entrada.entity';
import { CreateEntradaDto } from './dto/create-entrada.dto';
import { UpdateEntradaDto } from './dto/update-entrada.dto';
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
      qb.andWhere(
        '(LOWER(r.nombre) LIKE LOWER(:search) OR LOWER(e.num_guia) LIKE LOWER(:search))',
        {
          search: `%${query.search}%`,
        },
      );
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
    const entrada = await this.entradasRepo.findOne({
      where: { id },
      relations: [
        'recurso',
        'recurso.categoria',
        'quienEntrega',
        'quienRecibe',
        'medioTransporte',
      ],
    });
    if (!entrada) throw new NotFoundException('Entrada no encontrada');
    return entrada;
  }

  async create(dto: CreateEntradaDto, userId: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const entrada = manager.create(Entrada, {
        ...dto,
        created_by: userId,
      });
      const savedEntrada = await manager.save(entrada);

      // Register movement for traceability (within transaction)
      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, recurso_id, cantidad, fecha, descripcion, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'ENTRADA',
          savedEntrada.id,
          dto.recurso_id,
          dto.cantidad,
          dto.fecha,
          `Guía: ${dto.num_guia || 'S/N'}`,
          userId,
        ],
      );

      return savedEntrada;
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateEntradaDto, userId: string) {
    const entrada = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      const recursoId = dto.recurso_id ?? entrada.recurso.id;
      const cantidad = dto.cantidad ?? Number(entrada.cantidad);
      const fecha = dto.fecha ?? entrada.fecha.toISOString();
      const numGuia =
        'num_guia' in dto ? (dto.num_guia ?? null) : entrada.num_guia;
      const entregaId =
        'quien_entrega_id' in dto
          ? (dto.quien_entrega_id ?? null)
          : entrada.quienEntrega?.id ?? null;
      const recibeId =
        'quien_recibe_id' in dto
          ? (dto.quien_recibe_id ?? null)
          : entrada.quienRecibe?.id ?? null;
      const transporteId =
        'medio_transporte_id' in dto
          ? (dto.medio_transporte_id ?? null)
          : entrada.medioTransporte?.id ?? null;

      await manager.query(
        `UPDATE entradas SET fecha=$1, num_guia=$2, recurso_id=$3, cantidad=$4,
         quien_entrega_id=$5, quien_recibe_id=$6, medio_transporte_id=$7 WHERE id=$8`,
        [fecha, numGuia, recursoId, cantidad, entregaId, recibeId, transporteId, id],
      );

      await manager.query(
        `UPDATE movimientos SET cantidad=$1, recurso_id=$2, fecha=$3, descripcion=$4
         WHERE tipo='ENTRADA' AND referencia_id=$5`,
        [cantidad, recursoId, fecha, `Guía: ${numGuia || 'S/N'}`, id],
      );
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const entrada = await this.findOne(id);
    await this.entradasRepo.remove(entrada);
    return { message: 'Entrada eliminada' };
  }
}
