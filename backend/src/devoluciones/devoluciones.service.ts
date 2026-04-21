import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Devolucion } from './devolucion.entity';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { DistribucionFrente } from '../distribucion-frentes/distribucion-frente.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class DevolucionesService {
  constructor(
    @InjectRepository(Devolucion)
    private devolucionesRepo: Repository<Devolucion>,
    @InjectRepository(DistribucionFrente)
    private distribucionRepo: Repository<DistribucionFrente>,
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateDevolucionDto) {
    const distribucion = await this.distribucionRepo.findOne({
      where: { id: dto.distribucion_frente_id },
    });
    if (!distribucion) throw new NotFoundException('Distribución no encontrada');

    const usuario = await this.usuariosRepo.findOne({
      where: { id: dto.quien_devuelve_id },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (dto.cantidad_devuelta > distribucion.cantidad) {
      throw new BadRequestException(
        'La cantidad devuelta no puede exceder la cantidad distribuida',
      );
    }

    const devolucion = this.devolucionesRepo.create(dto);
    const result = await this.devolucionesRepo.save(devolucion);

    // Register movement for audit trail
    await this.dataSource.query(
      `INSERT INTO movimientos (tipo, referencia_id, recurso_id, cantidad, fecha, created_by)
       VALUES ('ENTRADA', $1, $2, $3, NOW(), $4)`,
      [result.id, distribucion.recurso_id, dto.cantidad_devuelta, dto.quien_devuelve_id],
    );

    return result;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    distribucion_frente_id?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        d.id,
        d.distribucion_frente_id,
        d.cantidad_devuelta,
        d.quien_devuelve_id,
        d.estado,
        d.fecha_devolucion,
        d.observaciones,
        d.created_at,
        u.nombre as quien_devuelve_nombre,
        r.nombre as recurso_nombre,
        ft.nombre as frente_nombre
      FROM devoluciones d
      JOIN usuarios u ON d.quien_devuelve_id = u.id
      JOIN distribucion_frentes df ON d.distribucion_frente_id = df.id
      JOIN recursos r ON df.recurso_id = r.id
      JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (query.distribucion_frente_id) {
      sql += ` AND d.distribucion_frente_id = $${paramIndex}`;
      params.push(query.distribucion_frente_id);
      paramIndex++;
    }

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM (${sql}) sub`,
      params,
    );
    const total = parseInt(countResult[0].total);

    sql += ` ORDER BY d.fecha_devolucion DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(sql, params);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const result = await this.dataSource.query(
      `SELECT
        d.*,
        u.nombre as quien_devuelve_nombre,
        r.nombre as recurso_nombre,
        ft.nombre as frente_nombre
      FROM devoluciones d
      JOIN usuarios u ON d.quien_devuelve_id = u.id
      JOIN distribucion_frentes df ON d.distribucion_frente_id = df.id
      JOIN recursos r ON df.recurso_id = r.id
      JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
      WHERE d.id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Devolución no encontrada');
    return result[0];
  }
}
