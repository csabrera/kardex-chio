import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './devolucion.entity';
import { DistribucionFrente } from '../distribucion-frentes/distribucion-frente.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { DevolucionesService } from './devoluciones.service';
import { DevolucionesController } from './devoluciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Devolucion, DistribucionFrente, Usuario])],
  controllers: [DevolucionesController],
  providers: [DevolucionesService],
  exports: [DevolucionesService],
})
export class DevolucionesModule {}
