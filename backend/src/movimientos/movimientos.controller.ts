import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('movimientos')
@UseGuards(JwtAuthGuard)
export class MovimientosController {
  constructor(private movimientosService: MovimientosService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tipo') tipo?: string,
    @Query('recurso_id') recurso_id?: number,
    @Query('equipo_id') equipo_id?: number,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.movimientosService.findAll({
      page, limit, tipo, recurso_id, equipo_id, fecha_desde, fecha_hasta,
    });
  }
}
