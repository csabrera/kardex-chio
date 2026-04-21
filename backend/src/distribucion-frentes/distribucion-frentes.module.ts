import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistribucionFrente } from './distribucion-frente.entity';
import { Recurso } from '../recursos/recurso.entity';
import { FrenteTrabajo } from '../frentes-trabajo/frente-trabajo.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { DistribucionFrentesService } from './distribucion-frentes.service';
import { DistribucionFrentesController } from './distribucion-frentes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DistribucionFrente, Recurso, FrenteTrabajo, Usuario]),
  ],
  controllers: [DistribucionFrentesController],
  providers: [DistribucionFrentesService],
  exports: [DistribucionFrentesService],
})
export class DistribucionFrentesModule {}
