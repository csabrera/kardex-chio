import { Controller, Get, Inject } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(getDataSourceToken())
    private dataSource: DataSource,
  ) {}

  @Get()
  health() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  @Get('debug/usuarios')
  async debugUsuarios() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const usuarios = await queryRunner.query(
        'SELECT id, documento, rol, activo, nombre FROM usuarios LIMIT 10',
      );
      await queryRunner.release();
      return {
        count: usuarios.length,
        usuarios: usuarios,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
