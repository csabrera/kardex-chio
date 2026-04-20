import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Equipo } from './equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { CodeGenerator } from '../common/utils/code-generator';
import { Categoria } from '../categorias/categoria.entity';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private equiposRepo: Repository<Equipo>,
    @InjectRepository(Categoria)
    private categoriasRepo: Repository<Categoria>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: { page?: number; limit?: number; search?: string; estado?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    // Usa la vista para obtener stock calculado
    let whereClause = 'WHERE e.activo = TRUE';
    const params: any[] = [];
    let idx = 1;

    if (query.search) {
      whereClause += ` AND (LOWER(e.nombre) LIKE LOWER($${idx}) OR LOWER(e.codigo) LIKE LOWER($${idx}))`;
      params.push(`%${query.search}%`);
      idx++;
    }

    if (query.estado) {
      whereClause += ` AND vs.estado = $${idx}`;
      params.push(query.estado);
      idx++;
    }

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total
       FROM equipos e
       JOIN vista_stock_equipos vs ON vs.id = e.id
       ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.total || '0');

    const data = await this.dataSource.query(
      `SELECT
         e.id, e.codigo, e.nombre, e.activo,
         e.categoria_id, c.nombre AS categoria_nombre,
         e.unidad_medida_id, um.nombre AS unidad_nombre,
         vs.total_adquirido, vs.total_despachado, vs.total_retornado,
         vs.stock_disponible, vs.estado
       FROM equipos e
       JOIN vista_stock_equipos vs ON vs.id = e.id
       LEFT JOIN categorias c        ON c.id  = e.categoria_id
       LEFT JOIN unidades_medida um  ON um.id = e.unidad_medida_id
       ${whereClause}
       ORDER BY e.nombre ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    const formatted = data.map((row: any) => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      activo: row.activo,
      categoria: row.categoria_id ? { id: row.categoria_id, nombre: row.categoria_nombre } : null,
      unidadMedida: row.unidad_medida_id ? { id: row.unidad_medida_id, nombre: row.unidad_nombre } : null,
      stock_disponible: Number(row.stock_disponible),
      total_adquirido: Number(row.total_adquirido),
      total_despachado: Number(row.total_despachado),
      total_retornado: Number(row.total_retornado),
      estado: row.estado,
    }));

    return { data: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const equipo = await this.equiposRepo.findOne({
      where: { id },
      relations: ['categoria', 'unidadMedida'],
    });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return equipo;
  }

  async getStockDisponible(equipo_id: number): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT stock_disponible FROM vista_stock_equipos WHERE id = $1`,
      [equipo_id],
    );
    return result.length ? Number(result[0].stock_disponible) : 0;
  }

  async getCodigoPreview(nombre: string, categoria_id?: number) {
    if (!nombre) return { preview: '', nextNumber: 0 };

    let categoriaNombre = 'SIN';
    if (categoria_id) {
      const categoria = await this.categoriasRepo.findOne({ where: { id: Number(categoria_id) } });
      if (categoria) categoriaNombre = categoria.nombre;
    }

    const codePreview = CodeGenerator.generateCodePreview(nombre, categoriaNombre);
    const nextNumber = await this.getNextCodigoNumber(nombre, categoriaNombre);
    return { preview: `E-${codePreview}-${String(nextNumber).padStart(3, '0')}`, nextNumber };
  }

  private async getNextCodigoNumber(nombreEquipo: string, categoriaNombre: string): Promise<number> {
    const nombrePart = CodeGenerator.getFirstLetters(nombreEquipo);
    const categoriaPart = CodeGenerator.getFirstLetters(categoriaNombre);
    const prefijo = `${nombrePart}-${categoriaPart}`;

    const result = await this.dataSource.query(
      `SELECT codigo FROM equipos WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,
      [`${prefijo}%`],
    );
    if (!result.length) return 1;
    const numberPart = result[0].codigo.split('-').pop();
    return parseInt(numberPart || '0') + 1;
  }

  async create(dto: CreateEquipoDto, userId?: string) {
    // Validar nombre único (case-insensitive)
    const nombreExistente = await this.dataSource.query(
      `SELECT id, codigo, nombre FROM equipos WHERE LOWER(nombre) = LOWER($1) AND activo = true LIMIT 1`,
      [dto.nombre],
    );
    if (nombreExistente.length) {
      const e = nombreExistente[0];
      throw new ConflictException({
        message: `Ya existe un equipo con el nombre "${e.nombre}" (${e.codigo})`,
        existing: { id: Number(e.id), codigo: e.codigo, nombre: e.nombre },
      });
    }

    let categoriaNombre = 'SIN';
    if (dto.categoria_id) {
      const categoria = await this.categoriasRepo.findOne({ where: { id: dto.categoria_id } });
      if (categoria) categoriaNombre = categoria.nombre;
    }

    const codePreview = CodeGenerator.generateCodePreview(dto.nombre, categoriaNombre);
    const nextNumber = await this.getNextCodigoNumber(dto.nombre, categoriaNombre);
    const codigoFinal = `E-${codePreview}-${String(nextNumber).padStart(3, '0')}`;

    const codigoExists = await this.equiposRepo.findOne({ where: { codigo: codigoFinal } as any });
    if (codigoExists) throw new BadRequestException(`El código ${codigoFinal} ya existe`);

    return this.dataSource.transaction(async (manager) => {
      // Crear el equipo
      const equipo = manager.create(Equipo, {
        nombre: dto.nombre,
        categoria_id: dto.categoria_id,
        unidad_medida_id: dto.unidad_medida_id,
        codigo: codigoFinal,
        estado: 'EN_ALMACEN',
      });
      const savedEquipo = await manager.save(equipo);

      // Registrar la adquisición inicial como EntradaEquipo
      await manager.query(
        `INSERT INTO entrada_equipos
           (fecha, tipo_entrada, equipo_id, cantidad, created_by)
         VALUES (NOW(), 'ADQUISICION', $1, $2, $3)`,
        [savedEquipo.id, dto.cantidad_inicial, userId || null],
      );

      // Registrar en movimientos
      await manager.query(
        `INSERT INTO movimientos (tipo, referencia_id, equipo_id, cantidad, fecha, descripcion, created_by)
         SELECT 'ENTRADA_EQUIPO', ee.id, $1, $2, NOW(), 'Adquisición inicial', $3
         FROM entrada_equipos ee
         WHERE ee.equipo_id = $1
         ORDER BY ee.id DESC LIMIT 1`,
        [savedEquipo.id, dto.cantidad_inicial, userId || null],
      );

      return { ...savedEquipo, stock_disponible: dto.cantidad_inicial };
    });
  }

  async update(id: number, dto: UpdateEquipoDto) {
    const equipo = await this.findOne(id);
    Object.assign(equipo, dto);
    return this.equiposRepo.save(equipo);
  }

  async remove(id: number) {
    const equipo = await this.findOne(id);
    equipo.activo = false;
    await this.equiposRepo.save(equipo);
    return { message: 'Equipo desactivado' };
  }

  async getUbicacion(query: { equipo_id?: number; frente_trabajo_id?: number; tipo_salida?: string; cerrada?: string }) {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (query.equipo_id) {
      where += ` AND vu.equipo_id = $${idx++}`;
      params.push(query.equipo_id);
    }
    if (query.frente_trabajo_id) {
      where += ` AND se.frente_trabajo_id = $${idx++}`;
      params.push(query.frente_trabajo_id);
    }
    if (query.tipo_salida) {
      where += ` AND vu.tipo_salida = $${idx++}`;
      params.push(query.tipo_salida);
    }
    if (query.cerrada !== undefined) {
      where += ` AND vu.cerrada = $${idx++}`;
      params.push(query.cerrada === 'true');
    } else {
      // Por defecto solo abiertas
      where += ` AND vu.cerrada = FALSE`;
    }

    const data = await this.dataSource.query(
      `SELECT * FROM vista_ubicacion_equipos vu
       JOIN salida_equipos se ON se.id = vu.salida_id
       ${where}
       ORDER BY vu.equipo_nombre, vu.fecha DESC`,
      params,
    );

    return data.map((row: any) => ({
      salida_id: row.salida_id,
      equipo_id: row.equipo_id,
      codigo: row.codigo,
      equipo_nombre: row.equipo_nombre,
      tipo_salida: row.tipo_salida,
      fecha: row.fecha,
      frente_trabajo: row.frente_trabajo,
      descripcion_trabajo: row.descripcion_trabajo,
      quien_entrega: row.quien_entrega,
      quien_recibe: row.quien_recibe,
      cantidad_enviada: Number(row.cantidad_enviada),
      cantidad_retornada: Number(row.cantidad_retornada),
      cantidad_pendiente: Number(row.cantidad_pendiente),
      cerrada: row.cerrada,
    }));
  }
}
