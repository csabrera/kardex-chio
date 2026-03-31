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
import { FrentesTrabajoService } from './frentes-trabajo.service';
import { CreateFrenteTrabajoDto } from './dto/create-frente-trabajo.dto';
import { UpdateFrenteTrabajoDto } from './dto/update-frente-trabajo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuarios/usuario.entity';

@Controller('frentes-trabajo')
@UseGuards(JwtAuthGuard)
export class FrentesTrabajoController {
  constructor(private frentesTrabajoService: FrentesTrabajoService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.frentesTrabajoService.findAll();
  }

  @Get('activos')
  findActivos() {
    return this.frentesTrabajoService.findActivos();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.frentesTrabajoService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateFrenteTrabajoDto) {
    return this.frentesTrabajoService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFrenteTrabajoDto,
  ) {
    return this.frentesTrabajoService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.frentesTrabajoService.remove(id);
  }
}
