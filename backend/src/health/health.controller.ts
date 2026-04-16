import { Controller, Get, Post, Inject } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

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
        'SELECT id, documento, rol, activo, nombre, password FROM usuarios LIMIT 10',
      );
      await queryRunner.release();
      return {
        count: usuarios.length,
        usuarios: usuarios.map(u => ({
          ...u,
          password: u.password.substring(0, 20) + '...',
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('debug/reset-admin-password')
  async resetAdminPassword() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const hash = await bcrypt.hash('00000000', 10);
      console.log(`[DEBUG] Resetting admin password. New hash: ${hash}`);

      await queryRunner.query(
        'UPDATE usuarios SET password = $1 WHERE documento = $2',
        [hash, '00000000'],
      );

      await queryRunner.release();
      return {
        message: 'Admin password reset',
        hash: hash.substring(0, 20) + '...',
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
