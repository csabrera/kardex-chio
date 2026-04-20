import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { EntradaEquiposService } from './entrada-equipos.service';
import { CreateEntradaEquipoDto } from './dto/create-entrada-equipo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('entrada-equipos')
@UseGuards(JwtAuthGuard)
export class EntradaEquiposController {
  constructor(private entradaEquiposService: EntradaEquiposService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('tipo_entrada') tipo_entrada?: string,
    @Query('equipo_id') equipo_id?: number,
  ) {
    return this.entradaEquiposService.findAll({
      page,
      limit,
      search,
      fecha_desde,
      fecha_hasta,
      tipo_entrada,
      equipo_id,
    });
  }

  @Get('equipo/:equipoId')
  findHistorialByEquipo(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tipo_entrada') tipo_entrada?: string,
  ) {
    return this.entradaEquiposService.findHistorialByEquipo(equipoId, { page, limit, tipo_entrada });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entradaEquiposService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateEntradaEquipoDto, @Request() req: any) {
    return this.entradaEquiposService.create(dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entradaEquiposService.remove(id);
  }
}
