import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidaEquipo } from './salida-equipo.entity';
import { SalidaEquiposService } from './salida-equipos.service';
import { SalidaEquiposController } from './salida-equipos.controller';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Persona } from '../personas/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalidaEquipo, FrenteTrabajo, Persona])],
  controllers: [SalidaEquiposController],
  providers: [SalidaEquiposService],
  exports: [SalidaEquiposService],
})
export class SalidaEquiposModule {}
