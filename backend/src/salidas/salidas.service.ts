import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Salida } from './salida.entity';
import { CreateSalidaDto } from './dto/create-salida.dto';

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

  async remove(id: number) {
    const salida = await this.findOne(id);
    await this.salidasRepo.remove(salida);
    return { message: 'Salida eliminada' };
  }
}
