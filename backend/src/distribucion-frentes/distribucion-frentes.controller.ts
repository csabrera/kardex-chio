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
import { DistribucionFrentesService } from './distribucion-frentes.service';
import { CreateDistribucionFrenteDto } from './dto/create-distribucion-frente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('distribucion-frentes')
@UseGuards(JwtAuthGuard)
export class DistribucionFrentesController {
  constructor(private distribucionService: DistribucionFrentesService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('frente_trabajo_id') frente_trabajo_id?: number,
    @Query('activa') activa?: boolean,
  ) {
    return this.distribucionService.findAll({
      page,
      limit,
      frente_trabajo_id,
      activa,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.distribucionService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ALMACENERO, UserRole.ADMIN)
  create(@Body() dto: CreateDistribucionFrenteDto) {
    return this.distribucionService.create(dto);
  }

  @Post(':id/cerrar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ALMACENERO, UserRole.ADMIN)
  cerrar(@Param('id', ParseIntPipe) id: number) {
    return this.distribucionService.cerrarDistribucion(id);
  }
}
