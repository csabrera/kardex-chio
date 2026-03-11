import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  ALMACENERO = 'ALMACENERO',
  SUPERVISOR = 'SUPERVISOR',
}

export enum TipoDocumento {
  DNI = 'DNI',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoDocumento, default: TipoDocumento.DNI })
  tipo_documento: TipoDocumento;

  @Column({ unique: true, length: 20 })
  documento: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ALMACENERO })
  rol: UserRole;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: true })
  primer_inicio: boolean;

  @Column({ length: 100, nullable: true })
  nombre: string;

  @Column({ length: 100, nullable: true })
  apellido_paterno: string;

  @Column({ length: 100, nullable: true })
  apellido_materno: string;

  @Column({ length: 15, nullable: true })
  celular: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 300, nullable: true })
  direccion: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
