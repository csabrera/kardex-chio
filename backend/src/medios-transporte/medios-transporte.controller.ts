import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MediosTransporteService } from './medios-transporte.service';
import { CreateMedioTransporteDto } from './dto/create-medio-transporte.dto';
import { UpdateMedioTransporteDto } from './dto/update-medio-transporte.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('medios-transporte')
@UseGuards(JwtAuthGuard)
export class MediosTransporteController {
  constructor(private mediosTransporteService: MediosTransporteService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.mediosTransporteService.findAll();
  }

  @Get('activos')
  findActivos() {
    return this.mediosTransporteService.findActivos();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mediosTransporteService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMedioTransporteDto) {
    return this.mediosTransporteService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedioTransporteDto,
  ) {
    return this.mediosTransporteService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediosTransporteService.remove(id);
  }
}
