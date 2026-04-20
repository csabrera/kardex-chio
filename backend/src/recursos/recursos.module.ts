import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recurso } from './recurso.entity';
import { UnidadMedida } from '../unidades-medida/unidad-medida.entity';
import { Categoria } from '../categorias/categoria.entity';
import { RecursosService } from './recursos.service';
import { RecursosController } from './recursos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Recurso, UnidadMedida, Categoria])],
  controllers: [RecursosController],
  providers: [RecursosService],
  exports: [RecursosService],
})
export class RecursosModule {}
