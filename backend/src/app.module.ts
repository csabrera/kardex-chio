// KardexChio Backend - Clean build
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { UnidadesMedidaModule } from './unidades-medida/unidades-medida.module';
import { PersonasModule } from './personas/personas.module';
import { FrentesTrabajoModule } from './frentes-trabajo/frentes-trabajo.module';
import { MediosTransporteModule } from './medios-transporte/medios-transporte.module';
import { RecursosModule } from './recursos/recursos.module';
import { EntradasModule } from './entradas/entradas.module';
import { SalidasModule } from './salidas/salidas.module';
import { EquiposModule } from './equipos/equipos.module';
import { SalidaEquiposModule } from './salida-equipos/salida-equipos.module';
import { EntradaEquiposModule } from './entrada-equipos/entrada-equipos.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Si hay DATABASE_URL (producción), usarla directamente
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: false,
          };
        }

        // Si no, usar variables individuales (desarrollo local)
        return {
          type: 'postgres' as const,
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port: configService.get<number>('POSTGRES_PORT', 5432),
          username: configService.get<string>('POSTGRES_USER', 'kardexchio'),
          password: configService.get<string>(
            'POSTGRES_PASSWORD',
            'kardexchio_2026',
          ),
          database: configService.get<string>('POSTGRES_DB', 'kardexchio'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    UnidadesMedidaModule,
    PersonasModule,
    FrentesTrabajoModule,
    MediosTransporteModule,
    RecursosModule,
    EntradasModule,
    SalidasModule,
    EquiposModule,
    SalidaEquiposModule,
    EntradaEquiposModule,
    MovimientosModule,
    DashboardModule,
    ReportesModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private async initializeDatabase() {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Verificar si la tabla usuarios existe
      const tableExists = await queryRunner.hasTable('usuarios');

      if (tableExists) {
        console.log('✓ Database already initialized');
        return;
      }

      console.log('🔄 Initializing database with seed data...');

      // Insertar datos iniciales
      await queryRunner.query(`
        INSERT INTO categorias (nombre) VALUES
          ('Ferretería'),
          ('Pintura'),
          ('Eléctrico'),
          ('Seguridad'),
          ('Maderas'),
          ('Herramientas'),
          ('Limpieza'),
          ('Materiales de Construcción'),
          ('Combustibles'),
          ('Alimentos y Bebidas'),
          ('Oficina'),
          ('Equipos')
        ON CONFLICT (nombre) DO NOTHING
      `);

      await queryRunner.query(`
        INSERT INTO unidades_medida (codigo, nombre) VALUES
          ('UND', 'Unidad'),
          ('KG', 'Kilogramo'),
          ('LT', 'Litro'),
          ('M', 'Metro'),
          ('M2', 'Metro cuadrado'),
          ('BLS', 'Bolsa'),
          ('GLN', 'Galón'),
          ('RLL', 'Rollo'),
          ('PAR', 'Par'),
          ('CJA', 'Caja'),
          ('PZA', 'Pieza'),
          ('PLG', 'Pliego')
        ON CONFLICT (codigo) DO NOTHING
      `);

      // Usuario admin (password: 00000000)
      await queryRunner.query(`
        INSERT INTO usuarios (tipo_documento, documento, password, rol, primer_inicio, nombre, apellido_paterno, apellido_materno)
        VALUES ('DNI', '00000000', '$2b$10$N1GIjsmwKS/j2bJRWFhJoeudFOIZk16oCamYleYr1qKOODOTYJ1cO', 'ADMIN', FALSE, 'Administrador', 'Sistema', 'Admin')
        ON CONFLICT (documento) DO NOTHING
      `);

      console.log('✓ Database initialized successfully with seed data');
    } catch (error) {
      console.error('✗ Database initialization error:', error.message);
      // No lanzar error para permitir que continúe el startup
    } finally {
      await queryRunner.release();
    }
  }
}
