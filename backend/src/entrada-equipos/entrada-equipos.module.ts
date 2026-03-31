import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntradaEquipo } from './entrada-equipo.entity';
import { EntradaEquiposService } from './entrada-equipos.service';
import { EntradaEquiposController } from './entrada-equipos.controller';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Persona } from '../personas/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntradaEquipo, FrenteTrabajo, Persona]),
  ],
  controllers: [EntradaEquiposController],
  providers: [EntradaEquiposService],
  exports: [EntradaEquiposService],
})
export class EntradaEquiposModule {}
