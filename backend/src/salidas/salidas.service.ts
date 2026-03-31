import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Salida } from './salida.entity';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';

@Injectable()
export class SalidasService {
  constructor(
    @InjectRepository(Salida)
    private salidasRepo: Repository<Salida>,
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

    const qb = this.salidasRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.recurso', 'r')
      .leftJoinAndSelect('r.categoria', 'c')
      .leftJoinAndSelect('s.frenteTrabajo', 'ft')
      .leftJoinAndSelect('s.quienEntrega', 'qe')
      .leftJoinAndSelect('s.quienRecibe', 'qr');

    if (query.search) {
      qb.andWhere(
        '(LOWER(r.nombre) LIKE LOWER(:search) OR LOWER(ft.nombre) LIKE LOWER(:search))',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.categoria_id) {
      qb.andWhere('r.categoria_id = :catId', { catId: query.categoria_id });
    }

    if (query.fecha_desde) {
      qb.andWhere('s.fecha >= :desde', { desde: query.fecha_desde });
    }

    if (query.fecha_hasta) {
      qb.andWhere('s.fecha <= :hasta', { hasta: query.fecha_hasta });
    }

    qb.orderBy('s.fecha', 'DESC').addOrderBy('s.id', 'DESC');

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
    const salida = await this.salidasRepo.findOne({
      where: { id },
      relations: [
        'recurso',
        'recurso.categoria',
        'frenteTrabajo',
        'quienEntrega',
        'quienRecibe',
      ],
    });
    if (!salida) throw new NotFoundException('Salida no encontrada');
    return salida;
  }

  async create(dto: CreateSalidaDto, userId: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      // Validar stock disponible (within transaction to prevent race conditions)
      const stockResult = await manager.query(
        'SELECT existencia_actual FROM vista_inventario WHERE id = $1',
        [dto.recurso_id],
      );

      if (!stockResult.length) {
        throw new NotFoundException('Recurso no encontrado en inventario');
      }

      const existencia = parseFloat(stockResult[0].existencia_actual);
      if (dto.cantidad > existencia) {
        throw new BadRequestException(
          `Stock insuficiente. Existencia actual: ${existencia}, cantidad solicitada: ${dto.cantidad}`,
        );
      }

      const salida = manager.create(Salida, {
        ...dto,
        created_by: userId,
      });
      const savedSalida = await manager.save(salida);

      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, recurso_id, cantidad, fecha, descripcion, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'SALIDA',
          savedSalida.id,
          dto.recurso_id,
          dto.cantidad,
          dto.fecha,
          `${dto.descripcion_trabajo || ''}`,
          userId,
        ],
      );

      return savedSalida;
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateSalidaDto, userId: string) {
    const salida = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      const recursoId = dto.recurso_id ?? salida.recurso.id;
      const cantidad = dto.cantidad ?? Number(salida.cantidad);

      // Revalidar stock si cambia cantidad o recurso
      if (dto.cantidad !== undefined || dto.recurso_id !== undefined) {
        const stockResult = await manager.query(
          'SELECT existencia_actual FROM vista_inventario WHERE id = $1',
          [recursoId],
        );

        if (!stockResult.length) {
          throw new NotFoundException(
            `Recurso ${recursoId} no encontrado en inventario`,
          );
        }

        let disponible = parseFloat(stockResult[0].existencia_actual);
        // Si el recurso no cambió, la salida original ya está descontada del inventario
        // Se debe "devolver" esa cantidad para calcular la disponibilidad real
        if (recursoId === salida.recurso.id) {
          disponible += Number(salida.cantidad);
        }

        if (cantidad > disponible) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${disponible}`,
          );
        }
      }

      const fecha = dto.fecha ?? salida.fecha.toISOString();
      const numReg =
        'num_registro' in dto ? (dto.num_registro ?? null) : salida.num_registro;
      const frenteId =
        'frente_trabajo_id' in dto
          ? (dto.frente_trabajo_id ?? null)
          : salida.frenteTrabajo?.id ?? null;
      const descTrabajo =
        'descripcion_trabajo' in dto
          ? (dto.descripcion_trabajo ?? null)
          : salida.descripcion_trabajo;
      const entregaId =
        'quien_entrega_id' in dto
          ? (dto.quien_entrega_id ?? null)
          : salida.quienEntrega?.id ?? null;
      const recibeId =
        'quien_recibe_id' in dto
          ? (dto.quien_recibe_id ?? null)
          : salida.quienRecibe?.id ?? null;

      await manager.query(
        `UPDATE salidas SET fecha=$1, num_registro=$2, recurso_id=$3, cantidad=$4,
         frente_trabajo_id=$5, descripcion_trabajo=$6, quien_entrega_id=$7, quien_recibe_id=$8
         WHERE id=$9`,
        [
          fecha,
          numReg,
          recursoId,
          cantidad,
          frenteId,
          descTrabajo,
          entregaId,
          recibeId,
          id,
        ],
      );

      await manager.query(
        `UPDATE movimientos SET cantidad=$1, recurso_id=$2, fecha=$3, descripcion=$4
         WHERE tipo='SALIDA' AND referencia_id=$5`,
        [cantidad, recursoId, fecha, descTrabajo || '', id],
      );
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const salida = await this.findOne(id);
    await this.salidasRepo.remove(salida);
    return { message: 'Salida eliminada' };
  }
}
