import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DistribucionFrente } from './distribucion-frente.entity';
import { CreateDistribucionFrenteDto } from './dto/create-distribucion-frente.dto';
import { Recurso } from '../recursos/recurso.entity';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class DistribucionFrentesService {
  constructor(
    @InjectRepository(DistribucionFrente)
    private distribucionRepo: Repository<DistribucionFrente>,
    @InjectRepository(Recurso)
    private recursosRepo: Repository<Recurso>,
    @InjectRepository(FrenteTrabajo)
    private frentesRepo: Repository<FrenteTrabajo>,
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateDistribucionFrenteDto) {
    const recurso = await this.recursosRepo.findOne({
      where: { id: dto.recurso_id },
    });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');

    const frente = await this.frentesRepo.findOne({
      where: { id: dto.frente_trabajo_id },
    });
    if (!frente) throw new NotFoundException('Frente de trabajo no encontrado');

    const responsable = await this.usuariosRepo.findOne({
      where: { id: dto.responsable_id },
    });
    if (!responsable) throw new NotFoundException('Responsable no encontrado');

    const result = await this.dataSource.query(
      'SELECT existencia_actual FROM vista_inventario WHERE id = $1',
      [dto.recurso_id],
    );

    if (!result.length || result[0].existencia_actual < dto.cantidad) {
      throw new BadRequestException('Stock insuficiente para distribuir');
    }

    const distribucion = this.distribucionRepo.create(dto);
    return this.distribucionRepo.save(distribucion);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    frente_trabajo_id?: number;
    activa?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        df.id,
        df.recurso_id,
        df.frente_trabajo_id,
        df.cantidad,
        df.responsable_id,
        df.fecha_distribucion,
        df.activa,
        df.observaciones,
        r.nombre as recurso_nombre,
        ft.nombre as frente_nombre,
        u.nombre as responsable_nombre
      FROM distribucion_frentes df
      JOIN recursos r ON df.recurso_id = r.id
      JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
      JOIN usuarios u ON df.responsable_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (query.frente_trabajo_id) {
      sql += ` AND df.frente_trabajo_id = $${paramIndex}`;
      params.push(query.frente_trabajo_id);
      paramIndex++;
    }

    if (query.activa !== undefined) {
      sql += ` AND df.activa = $${paramIndex}`;
      params.push(query.activa);
      paramIndex++;
    }

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM (${sql}) sub`,
      params,
    );
    const total = parseInt(countResult[0].total);

    sql += ` ORDER BY df.fecha_distribucion DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
        df.*,
        r.nombre as recurso_nombre,
        ft.nombre as frente_nombre,
        u.nombre as responsable_nombre
      FROM distribucion_frentes df
      JOIN recursos r ON df.recurso_id = r.id
      JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
      JOIN usuarios u ON df.responsable_id = u.id
      WHERE df.id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Distribución no encontrada');
    return result[0];
  }

  async cerrarDistribucion(id: number) {
    const distribucion = await this.distribucionRepo.findOne({
      where: { id },
    });
    if (!distribucion) throw new NotFoundException('Distribución no encontrada');

    distribucion.activa = false;
    distribucion.fecha_cierre = new Date();
    return this.distribucionRepo.save(distribucion);
  }
}
