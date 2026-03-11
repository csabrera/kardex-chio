import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrenteTrabajo } from './frente-trabajo.entity';
import { FrentesTrabajoService } from './frentes-trabajo.service';
import { FrentesTrabajoController } from './frentes-trabajo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FrenteTrabajo])],
  controllers: [FrentesTrabajoController],
  providers: [FrentesTrabajoService],
  exports: [FrentesTrabajoService],
})
export class FrentesTrabajoModule {}
