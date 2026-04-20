import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    page?: number; limit?: number; search?: string;
    fecha_desde?: string; fecha_hasta?: string; tipo_salida?: string; cerrada?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const qb = this.salidaEquiposRepo
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.equipo', 'eq')
      .leftJoinAndSelect('se.frenteTrabajo', 'ft')
      .leftJoinAndSelect('se.quienEntrega', 'qe')
      .leftJoinAndSelect('se.quienRecibe', 'qr');

    if (query.search) {
      qb.andWhere('(LOWER(eq.nombre) LIKE LOWER(:s) OR LOWER(ft.nombre) LIKE LOWER(:s))', { s: `%${query.search}%` });
    }
    if (query.fecha_desde) qb.andWhere('se.fecha >= :desde', { desde: query.fecha_desde });
    if (query.fecha_hasta) qb.andWhere('se.fecha <= :hasta', { hasta: query.fecha_hasta });
    if (query.tipo_salida) qb.andWhere('se.tipo_salida = :ts', { ts: query.tipo_salida });
    if (query.cerrada !== undefined) qb.andWhere('se.cerrada = :c', { c: query.cerrada === 'true' });

    qb.orderBy('se.fecha', 'DESC').addOrderBy('se.id', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();

    // Añadir cantidad_pendiente calculada
    const enriched = await Promise.all(data.map(async (se) => {
      const retornado = await this.dataSource.query(
        `SELECT COALESCE(SUM(cantidad), 0) AS total FROM entrada_equipos
         WHERE salida_equipo_id = $1 AND tipo_entrada = 'RETORNO'`,
        [se.id],
      );
      return {
        ...se,
        cantidad_retornada: Number(retornado[0]?.total || 0),
        cantidad_pendiente: Number(se.cantidad) - Number(retornado[0]?.total || 0),
      };
    }));

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const se = await this.salidaEquiposRepo.findOne({
      where: { id },
      relations: ['equipo', 'frenteTrabajo', 'quienEntrega', 'quienRecibe'],
    });
    if (!se) throw new NotFoundException('Salida de equipo no encontrada');
    return se;
  }

  // Salidas abiertas de un equipo específico (para el selector de retorno)
  async findAbiertasByEquipo(equipo_id: number) {
    const data = await this.dataSource.query(
      `SELECT
         se.id, se.fecha, se.tipo_salida, se.cantidad,
         ft.nombre AS frente_trabajo,
         se.cantidad - COALESCE(SUM(ee.cantidad), 0) AS cantidad_pendiente
       FROM salida_equipos se
       LEFT JOIN frentes_trabajo ft ON ft.id = se.frente_trabajo_id
       LEFT JOIN entrada_equipos ee ON ee.salida_equipo_id = se.id AND ee.tipo_entrada = 'RETORNO'
       WHERE se.equipo_id = $1 AND se.cerrada = FALSE
       GROUP BY se.id, ft.id
       HAVING (se.cantidad - COALESCE(SUM(ee.cantidad), 0)) > 0
       ORDER BY se.fecha DESC`,
      [equipo_id],
    );
    return data.map((row: any) => ({
      id: row.id,
      fecha: row.fecha,
      tipo_salida: row.tipo_salida,
      cantidad: Number(row.cantidad),
      frente_trabajo: row.frente_trabajo,
      cantidad_pendiente: Number(row.cantidad_pendiente),
    }));
  }

  async create(dto: CreateSalidaEquipoDto, userId: string) {
    // Validar stock disponible
    const stockResult = await this.dataSource.query(
      `SELECT stock_disponible FROM vista_stock_equipos WHERE id = $1`,
      [dto.equipo_id],
    );
    const stockDisponible = Number(stockResult[0]?.stock_disponible || 0);

    if (dto.cantidad > stockDisponible) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${dto.cantidad}`,
      );
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const se = manager.create(SalidaEquipo, {
        fecha: new Date(),
        tipo_salida: dto.tipo_salida,
        equipo_id: dto.equipo_id,
        cantidad: dto.cantidad,
        frente_trabajo_id: dto.frente_trabajo_id,
        descripcion_trabajo: dto.descripcion_trabajo,
        quien_entrega_id: dto.quien_entrega_id,
        quien_recibe_id: dto.quien_recibe_id,
        cerrada: false,
        created_by: userId,
      });
      const savedSe = await manager.save(se);

      // Recalcular y actualizar estado del equipo
      await this.actualizarEstadoEquipo(manager, dto.equipo_id);

      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, equipo_id, cantidad, fecha, descripcion, created_by)
         VALUES ('SALIDA_EQUIPO', $1, $2, $3, NOW(), $4, $5)`,
        [savedSe.id, dto.equipo_id, dto.cantidad, dto.descripcion_trabajo || '', userId],
      );

      return savedSe;
    });

    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const se = await this.findOne(id);
    await this.salidaEquiposRepo.remove(se);
    return { message: 'Salida de equipo eliminada' };
  }

  async actualizarEstadoEquipo(manager: any, equipo_id: number) {
    await manager.query(
      `UPDATE equipos SET
         estado = (SELECT estado FROM vista_stock_equipos WHERE id = $1),
         updated_at = NOW()
       WHERE id = $1`,
      [equipo_id],
    );
  }
}
