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
import { Recurso } from '../recursos/recurso.entity.js';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';
import { Devolucion } from '../devoluciones/devolucion.entity.js';

@Entity('distribucion_frentes')
export class DistribucionFrente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recurso_id: number;

  @ManyToOne(() => Recurso)
  @JoinColumn({ name: 'recurso_id' })
  recurso: Recurso;

  @Column()
  frente_trabajo_id: number;

  @ManyToOne(() => FrenteTrabajo)
  @JoinColumn({ name: 'frente_trabajo_id' })
  frenteTrabajo: FrenteTrabajo;

  @Column('numeric')
  cantidad: number;

  @Column('uuid')
  responsable_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_distribucion: Date;

  @Column({ default: true })
  activa: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_cierre: Date;

  @Column({ nullable: true, type: 'text' })
  observaciones: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Devolucion, (dev) => dev.distribucionFrente)
  devoluciones: Devolucion[];
}
