import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private reportesService: ReportesService) {}

  @Get('inventario/excel')
  async inventarioExcel(@Res() res: Response) {
    const workbook = await this.reportesService.generarExcelInventario();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('inventario/pdf')
  async inventarioPdf(@Res() res: Response) {
    const buffer = await this.reportesService.generarPdfInventario();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.pdf');
    res.send(buffer);
  }

  @Get('entradas/excel')
  async entradasExcel(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    const workbook = await this.reportesService.generarExcelEntradas(fechaDesde, fechaHasta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=entradas.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('salidas/excel')
  async salidasExcel(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    const workbook = await this.reportesService.generarExcelSalidas(fechaDesde, fechaHasta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=salidas.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}
