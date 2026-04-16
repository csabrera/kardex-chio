// KardexChio Backend - Clean build
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { initializeSchema } from './database/initialize-schema';
import { HealthModule } from './health/health.module';
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
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
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
    // Run database initialization in background without blocking startup
    initializeSchema(this.dataSource).catch(error => {
      console.error('Failed to initialize database schema:', error);
    });
  }
}
