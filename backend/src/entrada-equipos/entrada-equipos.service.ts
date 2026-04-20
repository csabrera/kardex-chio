import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    page?: number; limit?: number; search?: string;
    fecha_desde?: string; fecha_hasta?: string; tipo_entrada?: string;
    equipo_id?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (query.equipo_id) {
      where += ` AND ee.equipo_id = $${idx++}`;
      params.push(Number(query.equipo_id));
    }
    if (query.search) {
      where += ` AND (LOWER(eq.nombre) LIKE LOWER($${idx}) OR LOWER(ft.nombre) LIKE LOWER($${idx}))`;
      params.push(`%${query.search}%`);
      idx++;
    }
    if (query.fecha_desde) {
      where += ` AND ee.fecha >= $${idx++}`;
      params.push(query.fecha_desde);
    }
    if (query.fecha_hasta) {
      where += ` AND ee.fecha <= $${idx++}`;
      params.push(query.fecha_hasta);
    }
    if (query.tipo_entrada) {
      where += ` AND ee.tipo_entrada = $${idx++}`;
      params.push(query.tipo_entrada);
    }

    const joins = `
      LEFT JOIN equipos eq        ON eq.id  = ee.equipo_id
      LEFT JOIN frentes_trabajo ft ON ft.id = ee.frente_trabajo_id
      LEFT JOIN personas qe        ON qe.id = ee.quien_entrega_id
      LEFT JOIN personas qr        ON qr.id = ee.quien_recibe_id
      LEFT JOIN salida_equipos so  ON so.id = ee.salida_equipo_id
      LEFT JOIN frentes_trabajo soft ON soft.id = so.frente_trabajo_id`;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM entrada_equipos ee ${joins} ${where}`,
      params,
    );
    const total = parseInt(countResult[0]?.total || '0');

    const rows = await this.dataSource.query(
      `SELECT
         ee.id, ee.fecha, ee.tipo_entrada, ee.cantidad, ee.descripcion_trabajo,
         ee.salida_equipo_id,
         eq.id   AS eq_id,   eq.nombre  AS eq_nombre,  eq.codigo AS eq_codigo,
         ft.id   AS ft_id,   ft.nombre  AS ft_nombre,
         qe.id   AS qe_id,   qe.nombre  AS qe_nombre,
         qr.id   AS qr_id,   qr.nombre  AS qr_nombre,
         so.id   AS so_id,   so.tipo_salida AS so_tipo,
         soft.nombre AS soft_nombre
       FROM entrada_equipos ee ${joins} ${where}
       ORDER BY ee.fecha DESC, ee.id DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    const data = rows.map((r: any) => ({
      id: r.id,
      fecha: r.fecha,
      tipo_entrada: r.tipo_entrada,
      cantidad: Number(r.cantidad),
      descripcion_trabajo: r.descripcion_trabajo,
      equipo: r.eq_id ? { id: r.eq_id, nombre: r.eq_nombre, codigo: r.eq_codigo } : null,
      frenteTrabajo: r.ft_id ? { id: r.ft_id, nombre: r.ft_nombre } : null,
      quienEntrega: r.qe_id ? { id: r.qe_id, nombre: r.qe_nombre } : null,
      quienRecibe: r.qr_id ? { id: r.qr_id, nombre: r.qr_nombre } : null,
      salidaOrigen: r.so_id ? {
        id: r.so_id,
        tipo_salida: r.so_tipo,
        frenteTrabajo: r.soft_nombre ? { nombre: r.soft_nombre } : null,
      } : null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const ee = await this.entradaEquiposRepo.findOne({
      where: { id },
      relations: ['equipo', 'frenteTrabajo', 'quienEntrega', 'quienRecibe', 'salidaOrigen', 'salidaOrigen.frenteTrabajo'],
    });
    if (!ee) throw new NotFoundException('Entrada de equipo no encontrada');
    return ee;
  }

  async create(dto: CreateEntradaEquipoDto, userId: string) {
    // Si es RETORNO, validar contra la salida origen
    if (dto.tipo_entrada === 'RETORNO') {
      if (!dto.salida_equipo_id) {
        throw new BadRequestException('Debe indicar la salida de origen para un retorno');
      }

      const pendienteResult = await this.dataSource.query(
        `SELECT
           se.cantidad - COALESCE(SUM(ee.cantidad), 0) AS pendiente,
           se.equipo_id
         FROM salida_equipos se
         LEFT JOIN entrada_equipos ee ON ee.salida_equipo_id = se.id AND ee.tipo_entrada = 'RETORNO'
         WHERE se.id = $1
         GROUP BY se.id`,
        [dto.salida_equipo_id],
      );

      if (!pendienteResult.length) {
        throw new BadRequestException('Salida de origen no encontrada');
      }

      const pendiente = Number(pendienteResult[0].pendiente);
      const equipo_id_salida = pendienteResult[0].equipo_id;

      if (dto.cantidad > pendiente) {
        throw new BadRequestException(
          `Cantidad a retornar (${dto.cantidad}) supera el pendiente de esa salida (${pendiente})`,
        );
      }

      // Asegurar que el equipo_id coincide con la salida origen
      if (dto.equipo_id !== equipo_id_salida) {
        throw new BadRequestException('El equipo no corresponde a la salida seleccionada');
      }
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const ee = manager.create(EntradaEquipo, {
        fecha: new Date(),
        tipo_entrada: dto.tipo_entrada,
        equipo_id: dto.equipo_id,
        salida_equipo_id: dto.salida_equipo_id || undefined,
        cantidad: dto.cantidad,
        frente_trabajo_id: dto.frente_trabajo_id,
        descripcion_trabajo: dto.descripcion_trabajo,
        quien_entrega_id: dto.quien_entrega_id,
        quien_recibe_id: dto.quien_recibe_id,
        created_by: userId,
      });
      const savedEe = await manager.save(ee);

      // Si es RETORNO, verificar si la salida queda completamente cerrada
      if (dto.tipo_entrada === 'RETORNO' && dto.salida_equipo_id) {
        const pendienteActual = await manager.query(
          `SELECT se.cantidad - COALESCE(SUM(ee2.cantidad), 0) AS pendiente
           FROM salida_equipos se
           LEFT JOIN entrada_equipos ee2 ON ee2.salida_equipo_id = se.id AND ee2.tipo_entrada = 'RETORNO'
           WHERE se.id = $1
           GROUP BY se.id`,
          [dto.salida_equipo_id],
        );
        if (pendienteActual.length && Number(pendienteActual[0].pendiente) <= 0) {
          await manager.query(
            `UPDATE salida_equipos SET cerrada = TRUE WHERE id = $1`,
            [dto.salida_equipo_id],
          );
        }
      }

      // Actualizar estado del equipo
      await manager.query(
        `UPDATE equipos SET
           estado = (SELECT estado FROM vista_stock_equipos WHERE id = $1),
           updated_at = NOW()
         WHERE id = $1`,
        [dto.equipo_id],
      );

      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, equipo_id, cantidad, fecha, descripcion, created_by)
         VALUES ('ENTRADA_EQUIPO', $1, $2, $3, NOW(), $4, $5)`,
        [savedEe.id, dto.equipo_id, dto.cantidad, `${dto.tipo_entrada}: ${dto.descripcion_trabajo || ''}`, userId],
      );

      return savedEe;
    });

    return this.findOne(saved.id);
  }

  async findHistorialByEquipo(equipoId: number, query: { page?: number; limit?: number; tipo_entrada?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;

    const joins = `
      LEFT JOIN equipos eq         ON eq.id  = ee.equipo_id
      LEFT JOIN frentes_trabajo ft  ON ft.id  = ee.frente_trabajo_id
      LEFT JOIN personas qe         ON qe.id  = ee.quien_entrega_id
      LEFT JOIN personas qr         ON qr.id  = ee.quien_recibe_id
      LEFT JOIN salida_equipos so   ON so.id  = ee.salida_equipo_id
      LEFT JOIN frentes_trabajo soft ON soft.id = so.frente_trabajo_id`;

    const conditions: string[] = [`ee.equipo_id = ${equipoId}`];
    const params: any[] = [];
    let idx = 1;

    if (query.tipo_entrada) {
      conditions.push(`ee.tipo_entrada = $${idx++}`);
      params.push(query.tipo_entrada);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM entrada_equipos ee ${joins} ${where}`,
      params,
    );
    const total = parseInt(countResult[0]?.total || '0');

    const rows = await this.dataSource.query(
      `SELECT
         ee.id, ee.fecha, ee.tipo_entrada, ee.cantidad, ee.descripcion_trabajo,
         ee.salida_equipo_id,
         eq.id   AS eq_id,   eq.nombre  AS eq_nombre,  eq.codigo AS eq_codigo,
         ft.id   AS ft_id,   ft.nombre  AS ft_nombre,
         qe.id   AS qe_id,   qe.nombre  AS qe_nombre,
         qr.id   AS qr_id,   qr.nombre  AS qr_nombre,
         so.id   AS so_id,   so.tipo_salida AS so_tipo,
         soft.nombre AS soft_nombre
       FROM entrada_equipos ee ${joins} ${where}
       ORDER BY ee.fecha DESC, ee.id DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    const data = rows.map((r: any) => ({
      id: r.id,
      fecha: r.fecha,
      tipo_entrada: r.tipo_entrada,
      cantidad: Number(r.cantidad),
      descripcion_trabajo: r.descripcion_trabajo,
      equipo: r.eq_id ? { id: r.eq_id, nombre: r.eq_nombre, codigo: r.eq_codigo } : null,
      frenteTrabajo: r.ft_id ? { id: r.ft_id, nombre: r.ft_nombre } : null,
      quienEntrega: r.qe_id ? { id: r.qe_id, nombre: r.qe_nombre } : null,
      quienRecibe: r.qr_id ? { id: r.qr_id, nombre: r.qr_nombre } : null,
      salidaOrigen: r.so_id ? {
        id: r.so_id,
        tipo_salida: r.so_tipo,
        frenteTrabajo: r.soft_nombre ? { nombre: r.soft_nombre } : null,
      } : null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async remove(id: number) {
    const ee = await this.findOne(id);
    await this.entradaEquiposRepo.remove(ee);
    return { message: 'Entrada de equipo eliminada' };
  }
}
