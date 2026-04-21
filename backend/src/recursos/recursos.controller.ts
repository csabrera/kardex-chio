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
  ParseIntPipe,
} from '@nestjs/common';
import { RecursosService } from './recursos.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('recursos')
@UseGuards(JwtAuthGuard)
export class RecursosController {
  constructor(private recursosService: RecursosService) {}

  @Get('verificar-nombre/:nombre')
  verificarNombre(@Param('nombre') nombre: string) {
    return this.recursosService.verificarNombre(nombre);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoria_id') categoria_id?: number,
    @Query('status') status?: string,
  ) {
    return this.recursosService.findAll({
      page,
      limit,
      search,
      categoria_id,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recursosService.findOne(id);
  }

  @Get(':id/historial')
  getHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.recursosService.getHistorial(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateRecursoDto) {
    return this.recursosService.create(dto);
  }

  @Post(':id/agregar-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  agregarStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { cantidad: number },
  ) {
    return this.recursosService.agregarStock(id, body.cantidad);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecursoDto) {
    return this.recursosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recursosService.remove(id);
  }
}
