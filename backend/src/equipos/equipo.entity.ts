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
  SALIDA = 'SALIDA',
  INGRESO = 'INGRESO',
}

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({
    type: 'enum',
    enum: EquipoEstado,
    default: EquipoEstado.EN_ALMACEN,
  })
  estado: EquipoEstado;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
