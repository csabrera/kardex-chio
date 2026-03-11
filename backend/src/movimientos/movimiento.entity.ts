import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Recurso } from '../recursos/recurso.entity.js';
import { Equipo } from '../equipos/equipo.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tipo: string; // 'ENTRADA', 'SALIDA', 'SALIDA_EQUIPO'

  @Column()
  referencia_id: number;

  @Column({ nullable: true })
  recurso_id: number;

  @ManyToOne(() => Recurso)
  @JoinColumn({ name: 'recurso_id' })
  recurso: Recurso;

  @Column({ nullable: true })
  equipo_id: number;

  @ManyToOne(() => Equipo)
  @JoinColumn({ name: 'equipo_id' })
  equipo: Equipo;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  created_by: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  creator: Usuario;
}
