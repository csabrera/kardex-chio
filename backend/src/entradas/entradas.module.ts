import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entrada } from './entrada.entity';
import { Persona } from '../personas/persona.entity';
import { MedioTransporte } from '../medios-transporte/medio-transporte.entity';
import { EntradasService } from './entradas.service';
import { EntradasController } from './entradas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entrada, Persona, MedioTransporte])],
  controllers: [EntradasController],
  providers: [EntradasService],
  exports: [EntradasService],
})
export class EntradasModule {}
