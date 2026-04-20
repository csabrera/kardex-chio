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
import { SalidaEquiposService } from './salida-equipos.service';
import { CreateSalidaEquipoDto } from './dto/create-salida-equipo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('salida-equipos')
@UseGuards(JwtAuthGuard)
export class SalidaEquiposController {
  constructor(private salidaEquiposService: SalidaEquiposService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('tipo_salida') tipo_salida?: string,
    @Query('cerrada') cerrada?: string,
  ) {
    return this.salidaEquiposService.findAll({
      page,
      limit,
      search,
      fecha_desde,
      fecha_hasta,
      tipo_salida,
      cerrada,
    });
  }

  @Get('abiertas/:equipo_id')
  findAbiertasByEquipo(@Param('equipo_id', ParseIntPipe) equipo_id: number) {
    return this.salidaEquiposService.findAbiertasByEquipo(equipo_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salidaEquiposService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateSalidaEquipoDto, @Request() req: any) {
    return this.salidaEquiposService.create(dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salidaEquiposService.remove(id);
  }
}
