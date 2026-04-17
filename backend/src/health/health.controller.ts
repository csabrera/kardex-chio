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

  @Get('verify')
  async verify() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const usuarios = await queryRunner.query(
        'SELECT id, documento, rol, nombre FROM usuarios WHERE documento = $1',
        ['00000000']
      );
      await queryRunner.release();
      return {
        found: usuarios.length > 0,
        usuario: usuarios[0] || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('fix')
  async fix() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const hash = await bcrypt.hash('00000000', 10);

      const resultado = await queryRunner.query(
        'UPDATE usuarios SET password = $1 WHERE documento = $2 RETURNING id, documento, nombre',
        [hash, '00000000']
      );

      await queryRunner.release();

      return {
        success: resultado.length > 0,
        message: 'Password fixed',
        user: resultado[0] || null,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}
