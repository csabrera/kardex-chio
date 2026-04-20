import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Categoria } from '../categorias/categoria.entity.js';
import { UnidadMedida } from '../unidades-medida/unidad-medida.entity.js';

export enum EquipoEstado {
  EN_ALMACEN = 'EN_ALMACEN',
  AGOTADO = 'AGOTADO',
  INACTIVO = 'INACTIVO',
}

export enum TipoSalidaEquipo {
  PRESTAMO = 'PRESTAMO',
  ASIGNACION = 'ASIGNACION',
}

export enum TipoEntradaEquipo {
  ADQUISICION = 'ADQUISICION',
  RETORNO = 'RETORNO',
}

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20, nullable: true })
  codigo: string;

  @Column({ length: 300 })
  nombre: string;

  @Column({ nullable: true })
  categoria_id: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column({ nullable: true })
  unidad_medida_id: number;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidadMedida: UnidadMedida;

  // estado se calcula desde la vista vista_stock_equipos, no se guarda manualmente
  @Column({ type: 'character varying', length: 20, default: 'EN_ALMACEN' })
  estado: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
