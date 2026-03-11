import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedioTransporte } from './medio-transporte.entity';
import { MediosTransporteService } from './medios-transporte.service';
import { MediosTransporteController } from './medios-transporte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedioTransporte])],
  controllers: [MediosTransporteController],
  providers: [MediosTransporteService],
  exports: [MediosTransporteService],
})
export class MediosTransporteModule {}
