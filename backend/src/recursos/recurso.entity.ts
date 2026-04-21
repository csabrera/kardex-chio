import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Categoria } from '../categorias/categoria.entity.js';
import { UnidadMedida } from '../unidades-medida/unidad-medida.entity.js';
import { Entrada } from '../entradas/entrada.entity.js';
import { Salida } from '../salidas/salida.entity.js';

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  nombre: string;

  @Column()
  categoria_id: number;

  @ManyToOne(() => Categoria, (cat) => cat.recursos)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column()
  unidad_medida_id: number;

  @ManyToOne(() => UnidadMedida)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidadMedida: UnidadMedida;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Entrada, (entrada) => entrada.recurso)
  entradas: Entrada[];

  @OneToMany(() => Salida, (salida) => salida.recurso)
  salidas: Salida[];
}
