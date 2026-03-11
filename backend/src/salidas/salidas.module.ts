import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salida } from './salida.entity';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Persona } from '../personas/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Salida, FrenteTrabajo, Persona])],
  controllers: [SalidasController],
  providers: [SalidasService],
  exports: [SalidasService],
})
export class SalidasModule {}
