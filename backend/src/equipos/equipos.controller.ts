import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('equipos')
@UseGuards(JwtAuthGuard)
export class EquiposController {
  constructor(private equiposService: EquiposService) {}

  @Get('preview-codigo')
  getCodigoPreview(
    @Query('nombre') nombre: string,
    @Query('categoria_id') categoria_id?: number,
  ) {
    return this.equiposService.getCodigoPreview(nombre, categoria_id);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('estado') estado?: string,
  ) {
    return this.equiposService.findAll({ page, limit, search, estado });
  }

  @Get('ubicacion')
  getUbicacion(
    @Query('equipo_id') equipo_id?: number,
    @Query('frente_trabajo_id') frente_trabajo_id?: number,
    @Query('tipo_salida') tipo_salida?: string,
    @Query('cerrada') cerrada?: string,
  ) {
    return this.equiposService.getUbicacion({ equipo_id, frente_trabajo_id, tipo_salida, cerrada });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateEquipoDto, @Request() req: any) {
    return this.equiposService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEquipoDto) {
    return this.equiposService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.remove(id);
  }
}
