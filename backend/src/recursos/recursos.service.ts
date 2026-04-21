import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recurso } from './recurso.entity';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { Categoria } from '../categorias/categoria.entity';

@Injectable()
export class RecursosService {
  constructor(
    @InjectRepository(Recurso)
    private recursosRepo: Repository<Recurso>,
    @InjectRepository(Categoria)
    private categoriasRepo: Repository<Categoria>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoria_id?: number;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        v.*
      FROM vista_inventario v
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (query.search) {
      sql += ` AND (LOWER(v.nombre) LIKE LOWER($${paramIndex}) OR LOWER(v.codigo) LIKE LOWER($${paramIndex}))`;
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.categoria_id) {
      sql += ` AND v.categoria_id = $${paramIndex}`;
      params.push(query.categoria_id);
      paramIndex++;
    }

    if (query.status) {
      sql += ` AND v.status = $${paramIndex}`;
      params.push(query.status);
      paramIndex++;
    }

    // Count total
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM (${sql}) sub`,
      params,
    );
    const total = parseInt(countResult[0].total);

    // Get paginated results
    sql += ` ORDER BY v.nombre ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
      'SELECT * FROM vista_inventario WHERE id = $1',
      [id],
    );
    if (!result.length) throw new NotFoundException('Recurso no encontrado');
    return result[0];
  }

  async findByNombre(nombre: string): Promise<Recurso | null> {
    return this.recursosRepo.findOne({
      where: { nombre, activo: true },
    });
  }

  async verificarNombre(nombre: string): Promise<{
    existe: boolean;
    recurso?: { id: number; nombre: string; existencia_actual: number };
  }> {
    const recurso = await this.findByNombre(nombre);
    if (!recurso) {
      return { existe: false };
    }

    const result = await this.dataSource.query(
      'SELECT id, nombre, existencia_actual FROM vista_inventario WHERE id = $1',
      [recurso.id],
    );

    return {
      existe: true,
      recurso: result[0],
    };
  }

  async create(dto: CreateRecursoDto) {
    const categoria = await this.categoriasRepo.findOne({
      where: { id: dto.categoria_id },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    const recurso = this.recursosRepo.create(dto);
    return this.recursosRepo.save(recurso);
  }

  async agregarStock(id: number, cantidad: number) {
    const recurso = await this.recursosRepo.findOne({ where: { id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');

    const entrada = await this.dataSource.query(
      `INSERT INTO entradas (fecha, recurso_id, cantidad, created_by)
       VALUES (NOW(), $1, $2, NULL)
       RETURNING id`,
      [id, cantidad],
    );

    await this.dataSource.query(
      `INSERT INTO movimientos (tipo, referencia_id, recurso_id, cantidad, fecha, created_by)
       VALUES ('ENTRADA', $1, $2, $3, NOW(), NULL)`,
      [entrada[0].id, id, cantidad],
    );

    return { message: 'Stock agregado exitosamente', entradaId: entrada[0].id };
  }

  async update(id: number, dto: UpdateRecursoDto) {
    const recurso = await this.recursosRepo.findOne({ where: { id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    Object.assign(recurso, dto);
    return this.recursosRepo.save(recurso);
  }

  async remove(id: number) {
    const recurso = await this.recursosRepo.findOne({ where: { id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    recurso.activo = false;
    await this.recursosRepo.save(recurso);
    return { message: 'Recurso desactivado' };
  }

  async getHistorial(id: number) {
    const recurso = await this.findOne(id);

    const entradas = await this.dataSource.query(
      `SELECT e.id, e.fecha, e.num_guia, e.cantidad, 'ENTRADA' as tipo, e.created_at,
              pe.nombre as quien_entrega, pr.nombre as quien_recibe, mt.nombre as medio_transporte
       FROM entradas e
       LEFT JOIN personas pe ON e.quien_entrega_id = pe.id
       LEFT JOIN personas pr ON e.quien_recibe_id = pr.id
       LEFT JOIN medios_transporte mt ON e.medio_transporte_id = mt.id
       WHERE e.recurso_id = $1 ORDER BY e.fecha DESC`,
      [id],
    );

    const salidas = await this.dataSource.query(
      `SELECT s.id, s.fecha, s.num_registro, s.cantidad, s.descripcion_trabajo, 'SALIDA' as tipo, s.created_at,
              ft.nombre as frente_trabajo, pe.nombre as quien_entrega, pr.nombre as quien_recibe
       FROM salidas s
       LEFT JOIN frentes_trabajo ft ON s.frente_trabajo_id = ft.id
       LEFT JOIN personas pe ON s.quien_entrega_id = pe.id
       LEFT JOIN personas pr ON s.quien_recibe_id = pr.id
       WHERE s.recurso_id = $1 ORDER BY s.fecha DESC`,
      [id],
    );

    return {
      recurso,
      movimientos: [...entradas, ...salidas].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      ),
    };
  }
}
