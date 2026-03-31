import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Recurso } from '../recursos/recurso.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';
import { Persona } from '../personas/persona.entity.js';
import { MedioTransporte } from '../medios-transporte/medio-transporte.entity.js';

@Entity('entradas')
export class Entrada {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ length: 50, nullable: true })
  num_guia: string;

  @Column()
  recurso_id: number;

  @ManyToOne(() => Recurso, (recurso) => recurso.entradas)
  @JoinColumn({ name: 'recurso_id' })
  recurso: Recurso;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

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

  @Column({ nullable: true })
  medio_transporte_id: number;

  @ManyToOne(() => MedioTransporte, { nullable: true })
  @JoinColumn({ name: 'medio_transporte_id' })
  medioTransporte: MedioTransporte;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  created_by: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  creator: Usuario;
}
