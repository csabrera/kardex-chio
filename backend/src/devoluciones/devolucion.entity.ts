import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DistribucionFrente } from '../distribucion-frentes/distribucion-frente.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';

@Entity('devoluciones')
export class Devolucion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  distribucion_frente_id: number;

  @ManyToOne(() => DistribucionFrente, (df) => df.devoluciones)
  @JoinColumn({ name: 'distribucion_frente_id' })
  distribucionFrente: DistribucionFrente;

  @Column('numeric')
  cantidad_devuelta: number;

  @Column('uuid')
  quien_devuelve_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'quien_devuelve_id' })
  quienDevuelve: Usuario;

  @Column({ type: 'enum', enum: ['BUENO', 'DAÑADO', 'PARCIAL'], default: 'BUENO' })
  estado: 'BUENO' | 'DAÑADO' | 'PARCIAL';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_devolucion: Date;

  @Column({ nullable: true, type: 'text' })
  observaciones: string;

  @CreateDateColumn()
  created_at: Date;
}
