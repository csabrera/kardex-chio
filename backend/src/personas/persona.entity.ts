import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PersonaTipo {
  PROVEEDOR = 'PROVEEDOR',
  TRABAJADOR = 'TRABAJADOR',
  TRANSPORTISTA = 'TRANSPORTISTA',
}

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: PersonaTipo })
  tipo: PersonaTipo;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  documento: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 15, nullable: true })
  telefono: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
