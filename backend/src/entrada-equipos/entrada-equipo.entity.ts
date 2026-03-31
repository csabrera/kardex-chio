import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Equipo } from '../equipos/equipo.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity.js';
import { Persona } from '../personas/persona.entity.js';

@Entity('entrada_equipos')
export class EntradaEquipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ length: 50, nullable: true })
  num_registro: string;

  @Column()
  equipo_id: number;

  @ManyToOne(() => Equipo)
  @JoinColumn({ name: 'equipo_id' })
  equipo: Equipo;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ nullable: true })
  frente_trabajo_id: number;

  @ManyToOne(() => FrenteTrabajo, { nullable: true })
  @JoinColumn({ name: 'frente_trabajo_id' })
  frenteTrabajo: FrenteTrabajo;

  @Column({ length: 300, nullable: true })
  descripcion_trabajo: string;

  @Column({ nullable: true })
  quien_entrega_id: number;

  @ManyToOne(() => Persona, { nullable: true })
  @JoinColumn({ name: 'quien_entrega_id' })
  quienEntrega: Persona;

  @Column({ nullable: true })
  quien_recibe_id: number;

  @ManyToOne(() => Persona, { nullable: true })
  @JoinColumn({ name: 'quien_recibe_id' })
  quienRecibe: Persona;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  created_by: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  creator: Usuario;
}
