# 🚀 PLAN DE REFACTORIZACIÓN: RECURSOS

**Objetivo**: Simplificar Recursos, eliminar código automático, agregar trazabilidad de distribución a frentes

**Alcance**: BD + Backend + Frontend (3 capas)

---

## 📊 **FASE 1: BASE DE DATOS**

### 1.1 - TABLA: recursos (ACTUALIZAR)

```sql
-- ANTES:
CREATE TABLE recursos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- ❌ ELIMINAR
    nombre VARCHAR(300) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    unidad_medida_id INTEGER NOT NULL REFERENCES unidades_medida(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DESPUÉS:
CREATE TABLE recursos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(300) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    unidad_medida_id INTEGER NOT NULL REFERENCES unidades_medida(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Cambios:
-- - Eliminar campo 'codigo'
-- - ID es el identificador principal
```

### 1.2 - TABLA NUEVA: distribucion_frentes

```sql
CREATE TABLE distribucion_frentes (
    id SERIAL PRIMARY KEY,
    recurso_id INTEGER NOT NULL REFERENCES recursos(id),
    frente_trabajo_id INTEGER NOT NULL REFERENCES frentes_trabajo(id),
    cantidad DECIMAL(12,2) NOT NULL,
    
    -- Quién asigna:
    responsable_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_distribucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Estado:
    activa BOOLEAN DEFAULT TRUE,  -- ¿Sigue abierta o cerrada?
    fecha_cierre TIMESTAMP,       -- Cuándo se cierra manualmente
    
    -- Auditoría:
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance:
CREATE INDEX idx_distribucion_frente ON distribucion_frentes(frente_trabajo_id);
CREATE INDEX idx_distribucion_recurso ON distribucion_frentes(recurso_id);
CREATE INDEX idx_distribucion_activa ON distribucion_frentes(activa);
```

### 1.3 - TABLA NUEVA: devoluciones

```sql
CREATE TABLE devoluciones (
    id SERIAL PRIMARY KEY,
    distribucion_frente_id INTEGER NOT NULL REFERENCES distribucion_frentes(id),
    cantidad_devuelta DECIMAL(12,2) NOT NULL,
    
    -- Quien devuelve:
    quien_devuelve_id UUID NOT NULL REFERENCES usuarios(id),  
    fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Estado del material:
    estado VARCHAR(20) NOT NULL DEFAULT 'BUENO',  -- BUENO, DAÑADO, PARCIAL
    
    -- Auditoría:
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice:
CREATE INDEX idx_devolucion_distribucion ON devoluciones(distribucion_frente_id);
```

### 1.4 - VISTA NUEVA: vista_stock_por_frente

```sql
CREATE OR REPLACE VIEW vista_stock_por_frente AS
SELECT 
    r.id,
    r.nombre,
    c.nombre AS categoria,
    u.nombre AS unidad,
    
    -- Stock total (todas las entradas)
    COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN e.cantidad ELSE 0 END), 0) AS stock_total_entrada,
    
    -- Stock devuelto
    COALESCE(SUM(CASE WHEN d.id IS NOT NULL THEN d.cantidad_devuelta ELSE 0 END), 0) AS stock_devuelto,
    
    -- Stock disponible (en almacén central)
    COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN e.cantidad ELSE 0 END), 0) 
    - COALESCE(SUM(CASE WHEN df.id IS NOT NULL AND df.activa THEN df.cantidad ELSE 0 END), 0) AS stock_disponible,
    
    -- Stock distribuido (en frentes activos)
    COALESCE(SUM(CASE WHEN df.id IS NOT NULL AND df.activa THEN df.cantidad ELSE 0 END), 0) AS stock_distribuido,
    
    -- Distribuciones activas
    STRING_AGG(DISTINCT CONCAT(ft.nombre, ':', df.cantidad), ' | ') AS distribucion_por_frente
    
FROM recursos r
LEFT JOIN categorias c ON r.categoria_id = c.id
LEFT JOIN unidades_medida u ON r.unidad_medida_id = u.id
LEFT JOIN entradas e ON r.id = e.recurso_id
LEFT JOIN distribucion_frentes df ON r.id = df.recurso_id AND df.activa = TRUE
LEFT JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
LEFT JOIN devoluciones d ON df.id = d.distribucion_frente_id
WHERE r.activo = TRUE
GROUP BY r.id, r.nombre, c.nombre, u.nombre;
```

### 1.5 - MIGRACIÓN (Script SQL)

```sql
-- 1. Backup (precaución)
-- DELETE FROM movimientos WHERE tipo IN ('ENTRADA', 'SALIDA');
-- DELETE FROM entradas;
-- DELETE FROM salidas;

-- 2. Eliminar FK que usa recursos.codigo (si existe)
-- ALTER TABLE ... DROP CONSTRAINT ... (si hay)

-- 3. Quitar código automático
ALTER TABLE recursos DROP COLUMN IF EXISTS codigo;

-- 4. Crear tablas nuevas
CREATE TABLE distribucion_frentes ( ... );  -- Ver 1.2
CREATE TABLE devoluciones ( ... );           -- Ver 1.3

-- 5. Crear vista
CREATE VIEW vista_stock_por_frente AS ... ;   -- Ver 1.4

-- 6. Verificar
SELECT * FROM vista_stock_por_frente LIMIT 5;
```

---

## 🔧 **FASE 2: BACKEND (NestJS)**

### 2.1 - ACTUALIZAR: Recurso Entity

```typescript
// backend/src/recursos/recurso.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { UnidadMedida } from '../unidades-medida/unidad-medida.entity';

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 300 })
  nombre: string;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column({ name: 'categoria_id' })
  categoria_id: number;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidad_medida: UnidadMedida;

  @Column({ name: 'unidad_medida_id' })
  unidad_medida_id: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
```

### 2.2 - NUEVA ENTITY: DistribucionFrente

```typescript
// backend/src/recursos/distribucion-frente.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Recurso } from './recurso.entity';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('distribucion_frentes')
export class DistribucionFrente {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recurso)
  @JoinColumn({ name: 'recurso_id' })
  recurso: Recurso;

  @Column()
  recurso_id: number;

  @ManyToOne(() => FrenteTrabajo)
  @JoinColumn({ name: 'frente_trabajo_id' })
  frente_trabajo: FrenteTrabajo;

  @Column()
  frente_trabajo_id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @Column()
  responsable_id: string;  // UUID

  @Column({ default: true })
  activa: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_distribucion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_cierre: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
```

### 2.3 - NUEVA ENTITY: Devolucion

```typescript
// backend/src/recursos/devolucion.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DistribucionFrente } from './distribucion-frente.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('devoluciones')
export class Devolucion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DistribucionFrente)
  @JoinColumn({ name: 'distribucion_frente_id' })
  distribucion_frente: DistribucionFrente;

  @Column()
  distribucion_frente_id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad_devuelta: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'quien_devuelve_id' })
  quien_devuelve: Usuario;

  @Column()
  quien_devuelve_id: string;  // UUID

  @Column({ type: 'varchar', length: 20, default: 'BUENO' })
  estado: 'BUENO' | 'DAÑADO' | 'PARCIAL';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_devolucion: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
```

### 2.4 - ACTUALIZAR: RecursosService

```typescript
// backend/src/recursos/recursos.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recurso } from './recurso.entity';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';

@Injectable()
export class RecursosService {
  constructor(
    @InjectRepository(Recurso)
    private recursosRepo: Repository<Recurso>,
    private dataSource: DataSource,
  ) {}

  // VERIFICAR SI RECURSO EXISTE POR NOMBRE
  async findByNombre(nombre: string): Promise<Recurso | null> {
    return await this.recursosRepo.findOne({
      where: { nombre: nombre.trim() },
      relations: ['categoria', 'unidad_medida'],
    });
  }

  // CREATE (con validación de duplicado)
  async create(dto: CreateRecursoDto) {
    // Buscar si ya existe un recurso con este nombre
    const existente = await this.findByNombre(dto.nombre);
    
    if (existente) {
      // Retornar info del existente + flag para mostrar confirmación
      return {
        existe: true,
        recurso: existente,
        mensaje: `El recurso "${existente.nombre}" ya existe. ¿Deseas agregar stock a este?`,
      };
    }

    // Si no existe, crear nuevo
    const recurso = this.recursosRepo.create({
      nombre: dto.nombre,
      categoria_id: dto.categoria_id,
      unidad_medida_id: dto.unidad_medida_id,
      activo: true,
    });
    return await this.recursosRepo.save(recurso);
  }

  // AGREGAR STOCK A RECURSO EXISTENTE
  async agregarStock(recursoId: number, cantidad: number) {
    const recurso = await this.findOne(recursoId);
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    
    // Solo actualiza la tabla (sin crear entrada formal)
    // El stock se refleja en la vista vista_stock_por_frente
    return {
      success: true,
      recurso,
      mensaje: `Stock agregado a "${recurso.nombre}"`,
    };
  }

  // READ ALL con stock
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoria_id?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.recursosRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.categoria', 'c')
      .leftJoinAndSelect('r.unidad_medida', 'u')
      .where('r.activo = true');

    if (query.search) {
      qb.andWhere('LOWER(r.nombre) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.categoria_id) {
      qb.andWhere('r.categoria_id = :catId', { catId: query.categoria_id });
    }

    qb.orderBy('r.nombre', 'ASC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calcular stock para cada recurso (desde vista)
    const withStock = await Promise.all(
      data.map(async (r) => {
        const stock = await this.dataSource.query(
          'SELECT * FROM vista_stock_por_frente WHERE id = $1',
          [r.id],
        );
        return { ...r, ...stock[0] };
      }),
    );

    return {
      data: withStock,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // READ ONE
  async findOne(id: number) {
    const recurso = await this.recursosRepo.findOne({
      where: { id },
      relations: ['categoria', 'unidad_medida'],
    });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  // UPDATE
  async update(id: number, dto: UpdateRecursoDto) {
    const recurso = await this.findOne(id);
    Object.assign(recurso, dto);
    return await this.recursosRepo.save(recurso);
  }

  // DELETE (lógico)
  async delete(id: number) {
    const recurso = await this.findOne(id);
    recurso.activo = false;
    return await this.recursosRepo.save(recurso);
  }
}
```

### 2.5 - NUEVA: DistribucionFrentesService

```typescript
// backend/src/recursos/distribucion-frentes.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistribucionFrente } from './distribucion-frente.entity';
import { Devolucion } from './devolucion.entity';

@Injectable()
export class DistribucionFrentesService {
  constructor(
    @InjectRepository(DistribucionFrente)
    private distRepo: Repository<DistribucionFrente>,
    @InjectRepository(Devolucion)
    private devRepo: Repository<Devolucion>,
  ) {}

  // CREAR DISTRIBUCIÓN
  async crear(dto: {
    recurso_id: number;
    frente_trabajo_id: number;
    cantidad: number;
    responsable_id: string;
    observaciones?: string;
  }) {
    const dist = this.distRepo.create(dto);
    return await this.distRepo.save(dist);
  }

  // LISTAR DISTRIBUCIONES ACTIVAS
  async findActivas(frente_id?: number) {
    const qb = this.distRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.recurso', 'r')
      .leftJoinAndSelect('d.frente_trabajo', 'f')
      .leftJoinAndSelect('d.responsable', 'u')
      .where('d.activa = true');

    if (frente_id) {
      qb.andWhere('d.frente_trabajo_id = :frenteId', { frenteId: frente_id });
    }

    return await qb.orderBy('d.fecha_distribucion', 'DESC').getMany();
  }

  // CERRAR DISTRIBUCIÓN
  async cerrar(id: number) {
    const dist = await this.distRepo.findOne({ where: { id } });
    if (!dist) throw new NotFoundException('Distribución no encontrada');
    
    dist.activa = false;
    dist.fecha_cierre = new Date();
    return await this.distRepo.save(dist);
  }

  // REGISTRAR DEVOLUCIÓN
  async registrarDevolucion(dto: {
    distribucion_frente_id: number;
    cantidad_devuelta: number;
    quien_devuelve_id: string;
    estado: 'BUENO' | 'DAÑADO' | 'PARCIAL';
    observaciones?: string;
  }) {
    const dist = await this.distRepo.findOne({
      where: { id: dto.distribucion_frente_id },
    });
    if (!dist) throw new NotFoundException('Distribución no encontrada');

    if (dto.cantidad_devuelta > dist.cantidad) {
      throw new BadRequestException(
        `No puedes devolver ${dto.cantidad_devuelta} si distribuyeron ${dist.cantidad}`,
      );
    }

    const dev = this.devRepo.create(dto);
    return await this.devRepo.save(dev);
  }

  // HISTORIAL COMPLETO DE UN RECURSO
  async historialRecurso(recurso_id: number) {
    return await this.distRepo.find({
      where: { recurso_id },
      relations: ['frente_trabajo', 'responsable'],
      order: { fecha_distribucion: 'DESC' },
    });
  }
}
```

### 2.6 - ACTUALIZAR: CreateRecursoDto

```typescript
// backend/src/recursos/dto/create-recurso.dto.ts

import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRecursoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  categoria_id: number;

  @IsNumber()
  @IsNotEmpty()
  unidad_medida_id: number;

  // ❌ REMOVIDO: codigo, preview, etc.
}
```

### 2.7 - NUEVOS ENDPOINTS: RecursosController

```typescript
// backend/src/recursos/recursos.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { RecursosService } from './recursos.service';
import { DistribucionFrentesService } from './distribucion-frentes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recursos')
@UseGuards(JwtAuthGuard)
export class RecursosController {
  constructor(
    private recursosService: RecursosService,
    private distService: DistribucionFrentesService,
  ) {}

  // VERIFICAR SI RECURSO EXISTE POR NOMBRE
  @Get('verificar-nombre/:nombre')
  async verificarNombre(@Param('nombre') nombre: string) {
    const existente = await this.recursosService.findByNombre(nombre);
    return {
      existe: !!existente,
      recurso: existente || null,
    };
  }

  // CREAR O AGREGAR STOCK
  @Post()
  async create(@Body() dto: CreateRecursoDto) {
    const resultado = await this.recursosService.create(dto);
    return resultado;
  }

  // CONFIRMAR Y AGREGAR STOCK A RECURSO EXISTENTE
  @Post('agregar-stock/:id')
  async agregarStock(@Param('id') id: number) {
    return await this.recursosService.agregarStock(id, 0); // cantidad es 0, solo cierra modal
  }

  @Get()
  findAll(@Query() query: any) {
    return this.recursosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.recursosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateRecursoDto) {
    return this.recursosService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.recursosService.delete(id);
  }

  // DISTRIBUCIONES
  @Post(':recurso_id/distribuir')
  distribuir(@Param('recurso_id') recurso_id: number, @Body() dto: any, @Request() req: any) {
    return this.distService.crear({
      recurso_id,
      responsable_id: req.user.id,
      ...dto,
    });
  }

  @Get('distribuciones/activas')
  obtenerDistribucionesActivas(@Query('frente_id') frente_id?: number) {
    return this.distService.findActivas(frente_id);
  }

  @Put('distribuciones/:id/cerrar')
  cerrarDistribucion(@Param('id') id: number) {
    return this.distService.cerrar(id);
  }

  // DEVOLUCIONES
  @Post('devoluciones')
  registrarDevolucion(@Body() dto: any, @Request() req: any) {
    return this.distService.registrarDevolucion({
      quien_devuelve_id: req.user.id,
      ...dto,
    });
  }

  // HISTORIAL
  @Get(':recurso_id/historial')
  historialRecurso(@Param('recurso_id') recurso_id: number) {
    return this.distService.historialRecurso(recurso_id);
  }
}
```

---

## 🎨 **FASE 3: FRONTEND (React)**

### 3.1 - MODAL: Nuevo Recurso (con validación de duplicado)

```typescript
// Cambios:
// ❌ Eliminar: input para código, preview de código
// ✅ Mantener: Nombre, Categoría, Unidad
// ✅ NUEVO: Validar duplicado por nombre
// ✅ NUEVO: Modal de confirmación si existe

export default function ModalNuevoRecurso({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre: '',
    categoria_id: '',
    unidad_medida_id: '',
  });
  const [confirmacion, setConfirmacion] = useState(null); // { existe: true, recurso: {...} }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/recursos', form);

      // Verificar si retorna "existe: true" (recurso duplicado)
      if (res.data.existe === true) {
        // Mostrar modal de confirmación
        setConfirmacion({
          existe: true,
          recurso: res.data.recurso,
          nuevoNombre: form.nombre,
        });
        return;
      }

      // Si no existe, fue creado exitosamente
      showSuccess('Recurso creado: ' + res.data.nombre + ' (ID: ' + res.data.id + ')');
      onSuccess();
    } catch (err) {
      showError(err.response?.data?.message || 'Error al crear recurso');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarAgregarStock = async () => {
    try {
      // Endpoint: POST /recursos/agregar-stock/:id
      await api.post(`/recursos/agregar-stock/${confirmacion.recurso.id}`);
      showSuccess(`Stock agregado a "${confirmacion.recurso.nombre}"`);
      setConfirmacion(null); // Cierra modal
      onSuccess();
    } catch (err) {
      showError('Error al agregar stock');
    }
  };

  // MODAL DE CONFIRMACIÓN (si existe duplicado)
  if (confirmacion?.existe) {
    return (
      <Modal onClose={() => setConfirmacion(null)}>
        <div className="text-center">
          <h2 className="text-lg font-bold mb-3">Recurso Duplicado</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
            <p className="text-sm text-slate-600 mb-3">
              El recurso <strong>"{confirmacion.recurso.nombre}"</strong> ya existe.
            </p>
            <div className="bg-white p-3 rounded text-sm">
              <p><strong>ID:</strong> {confirmacion.recurso.id}</p>
              <p><strong>Categoría:</strong> {confirmacion.recurso.categoria?.nombre}</p>
              <p><strong>Unidad:</strong> {confirmacion.recurso.unidad_medida?.nombre}</p>
            </div>
          </div>

          <p className="text-slate-700 mb-4">
            ¿Deseas agregar el stock a este recurso?
          </p>

          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => setConfirmacion(null)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmarAgregarStock}
              className="btn-success"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // MODAL DE CREACIÓN (normal)
  return (
    <Modal onClose={onClose}>
      <h2>Nuevo Recurso</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Campo: Nombre */}
        <div>
          <label>Nombre del Recurso *</label>
          <input
            type="text"
            placeholder="Ej: Cemento Portland 50kg"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
            required
            className="input-field"
          />
        </div>

        {/* Campo: Categoría */}
        <div>
          <label>Categoría *</label>
          <select
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            required
            className="input-field"
          >
            <option value="">Selecciona categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* Campo: Unidad */}
        <div>
          <label>Unidad de Medida *</label>
          <select
            value={form.unidad_medida_id}
            onChange={(e) => setForm({ ...form, unidad_medida_id: e.target.value })}
            required
            className="input-field"
          >
            <option value="">Selecciona unidad</option>
            {unidades.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        {/* Nota: Activo por defecto */}
        <p className="text-xs text-slate-500">
          ℹ️ El recurso estará ACTIVO por defecto
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Crear Recurso
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

### 3.2 - ACTUALIZAR: Tabla de Recursos

```typescript
// Cambios:
// ✅ Mostrar ID como identificador principal
// ✅ Mostrar: ID | Nombre | Categoría | Unidad | Stock Total | Disponible | Distribuido

const columns = [
  {
    header: 'ID',
    key: 'id',
    className: 'w-12 font-bold text-center',
    render: (item) => item.id,
  },
  {
    header: 'Nombre',
    key: 'nombre',
    className: 'w-64',
    render: (item) => item.nombre,
  },
  {
    header: 'Categoría',
    key: 'categoria',
    className: 'w-40',
    render: (item) => item.categoria?.nombre || '-',
  },
  {
    header: 'Unidad',
    key: 'unidad',
    className: 'w-24',
    render: (item) => item.unidad_medida?.nombre || '-',
  },
  {
    header: 'Stock Total',
    key: 'stock_total',
    className: 'w-20 text-center',
    render: (item) => item.stock_total_entrada || '0',
  },
  {
    header: 'Disponible',
    key: 'disponible',
    className: 'w-24 text-center font-semibold text-emerald-600',
    render: (item) => item.stock_disponible || '0',
  },
  {
    header: 'En Frentes',
    key: 'distribuido',
    className: 'w-24 text-center font-semibold text-amber-600',
    render: (item) => item.stock_distribuido || '0',
  },
  {
    header: 'Acciones',
    key: 'acciones',
    hideOnMobile: true,
    render: (item) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(item)} className="btn-edit">
          Editar
        </button>
        <button onClick={() => handleDistribuir(item)} className="btn-action">
          Distribuir
        </button>
      </div>
    ),
  },
];
```

### 3.3 - NUEVO: Modal Distribuir a Frente

```typescript
// backend/src/recursos/distribuir.component.tsx

export default function ModalDistribuir({ recurso, onClose, onSuccess }) {
  const [form, setForm] = useState({
    frente_trabajo_id: '',
    cantidad: '',
    observaciones: '',
  });
  const [frentes, setFrente] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    api.get('/frentes-trabajo/activos').then(r => setFrente(r.data));
    api.get('/usuarios').then(r => setUsuarios(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post(`/recursos/${recurso.id}/distribuir`, form);
    showSuccess(`${form.cantidad} distribuidas a ${getFrenteName(form.frente_trabajo_id)}`);
    onSuccess();
  };

  return (
    <Modal onClose={onClose}>
      <h2>Distribuir a Frente: {recurso.nombre} (ID: {recurso.id})</h2>
      
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-sm">
          <strong>Stock disponible:</strong> {recurso.stock_disponible} {recurso.unidad_medida?.nombre}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Frente */}
        <div>
          <label>Frente de Trabajo *</label>
          <select
            value={form.frente_trabajo_id}
            onChange={(e) => setForm({ ...form, frente_trabajo_id: e.target.value })}
            required
            className="input-field"
          >
            <option value="">Selecciona frente</option>
            {frentes.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label>Cantidad a Distribuir *</label>
          <input
            type="number"
            step="0.01"
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            max={recurso.stock_disponible}
            required
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">
            Máximo: {recurso.stock_disponible} {recurso.unidad_medida?.nombre}
          </p>
        </div>

        {/* Observaciones */}
        <div>
          <label>Observaciones (opcional)</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            className="input-field"
            rows="3"
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-success">
            Distribuir
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

### 3.4 - NUEVO: Panel de Distribuciones Activas

```typescript
// backend/src/recursos/distribucion.component.tsx

export default function PanelDistribuciones({ recurso }) {
  const [distribuciones, setDistribuciones] = useState([]);

  useEffect(() => {
    api.get(`/recursos/${recurso.id}/distribuciones/activas`)
      .then(r => setDistribuciones(r.data));
  }, [recurso.id]);

  return (
    <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded">
      <h3 className="font-bold mb-3">Distribuciones Activas</h3>
      
      {distribuciones.length === 0 ? (
        <p className="text-slate-500">Sin distribuciones activas</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left">Frente</th>
              <th className="text-right">Cantidad</th>
              <th className="text-left">Responsable</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {distribuciones.map(d => (
              <tr key={d.id} className="border-b">
                <td>{d.frente_trabajo.nombre}</td>
                <td className="text-right font-semibold">{d.cantidad}</td>
                <td>{d.responsable.nombre}</td>
                <td>{new Date(d.fecha_distribucion).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDevolver(d)} className="btn-sm btn-warning">
                    Devolver
                  </button>
                  <button onClick={() => handleCerrar(d)} className="btn-sm btn-secondary">
                    Cerrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### FASE 1: BD
- [ ] Eliminar campo `codigo` de tabla recursos
- [ ] Crear tabla `distribucion_frentes`
- [ ] Crear tabla `devoluciones`
- [ ] Crear vista `vista_stock_por_frente`
- [ ] Correr migrations
- [ ] Verificar vista con `SELECT * FROM vista_stock_por_frente`

### FASE 2: Backend
- [ ] Actualizar `RecursoEntity` (quitar codigo)
- [ ] Crear `DistribucionFrenteEntity`
- [ ] Crear `DevolucionEntity`
- [ ] Actualizar `RecursosService`:
  - [ ] Agregar método `findByNombre()`
  - [ ] Actualizar `create()` para retornar flag "existe"
  - [ ] Agregar método `agregarStock()`
  - [ ] Quitar generador de códigos
- [ ] Crear `DistribucionFrentesService`
- [ ] Crear/Actualizar DTOs
- [ ] Agregar endpoints en `RecursosController`:
  - [ ] GET `/recursos/verificar-nombre/:nombre` (verificación)
  - [ ] POST `/recursos` (crear o confirmar duplicado)
  - [ ] POST `/recursos/agregar-stock/:id` (sumar stock)
- [ ] Compilar: `npm run build`
- [ ] Test: endpoints básicos con Postman

### FASE 3: Frontend
- [ ] Eliminar código de preview en `InventarioTab`
- [ ] Actualizar modal "Nuevo Recurso":
  - [ ] Agregar validación de duplicado
  - [ ] Crear modal de confirmación (Opción A)
  - [ ] Flujo: crea → detecta duplicado → muestra confirmación → cierra
- [ ] Actualizar tabla (mostrar ID + stock)
- [ ] Crear modal "Distribuir a Frente"
- [ ] Crear panel "Distribuciones Activas"
- [ ] Crear modal "Registrar Devolución"
- [ ] Test local: crear recurso, distribuir, devolver
- [ ] Verificar que la tabla muestra stock separado

### FASE 4: Verificación (NUEVA - Recursos Únicos)
- [ ] ✅ Crear recurso nuevo (sin duplicado)
- [ ] ✅ Intentar crear recurso DUPLICADO:
  - [ ] Aparece modal: "¿Agregar stock a este recurso?"
  - [ ] Click Confirmar → Cierra modal
  - [ ] Stock se actualiza en tabla
- [ ] ✅ Ver tabla con ID + Nombre + Stock
- [ ] ✅ Distribuir a frente
- [ ] ✅ Ver stock actualizado (disponible vs distribuido)
- [ ] ✅ Registrar devolución
- [ ] ✅ Cerrar distribución
- [ ] ✅ Reportes: Por recurso y por frente

---

## 🚀 **ORDEN DE EJECUCIÓN**

1. **BD**: Migrations SQL (15 min)
2. **Backend**: Entities + Service + Controller (45 min)
3. **Frontend**: UI + Modales (30 min)
4. **Testing**: Local + fixes (15 min)
5. **Deploy**: Git push → Railway (5 min)

**Total estimado**: 2 horas sin complicaciones

---

## ❓ **PREGUNTAS ANTES DE EMPEZAR**

1. ¿Comienzo MAÑANA?
2. ¿Quieres que trabaje **SOLO en Recursos** o también actualizo **Entradas/Salidas** para usar la nueva distribucion_frentes?
3. ¿Cambio el flujo actual (POST /salidas → ahora será POST /distribuir)?

Confirmás y **PARTIMOS** 🚀
