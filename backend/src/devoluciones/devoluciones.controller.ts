import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard)
export class DevolucionesController {
  constructor(private devolucionesService: DevolucionesService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('distribucion_frente_id') distribucion_frente_id?: number,
  ) {
    return this.devolucionesService.findAll({
      page,
      limit,
      distribucion_frente_id,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.devolucionesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ALMACENERO, UserRole.ADMIN)
  create(@Body() dto: CreateDevolucionDto) {
    return this.devolucionesService.create(dto);
  }
}
