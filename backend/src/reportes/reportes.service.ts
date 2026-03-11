import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportesService {
  constructor(private dataSource: DataSource) {}

  async generarExcelInventario(): Promise<ExcelJS.Workbook> {
    const data = await this.dataSource.query('SELECT * FROM vista_inventario ORDER BY nombre ASC');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventario');

    sheet.columns = [
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Recurso', key: 'nombre', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Unidad', key: 'unidad', width: 12 },
      { header: 'Entradas', key: 'total_entradas', width: 12 },
      { header: 'Salidas', key: 'total_salidas', width: 12 },
      { header: 'Existencia', key: 'existencia_actual', width: 12 },
      { header: 'Status', key: 'status', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' },
    };

    data.forEach((row: any) => {
      const excelRow = sheet.addRow(row);
      if (row.status === 'AGOTADO') {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEE2E2' },
        };
      }
    });

    return workbook;
  }

  async generarExcelEntradas(fechaDesde?: string, fechaHasta?: string): Promise<ExcelJS.Workbook> {
    let sql = `
      SELECT e.id, e.fecha, e.num_guia, r.codigo, r.nombre as recurso, c.nombre as categoria,
             um.nombre as unidad, e.cantidad,
             pe.nombre as quien_entrega, pr.nombre as quien_recibe, mt.nombre as medio_transporte
      FROM entradas e
      JOIN recursos r ON e.recurso_id = r.id
      JOIN categorias c ON r.categoria_id = c.id
      JOIN unidades_medida um ON r.unidad_medida_id = um.id
      LEFT JOIN personas pe ON e.quien_entrega_id = pe.id
      LEFT JOIN personas pr ON e.quien_recibe_id = pr.id
      LEFT JOIN medios_transporte mt ON e.medio_transporte_id = mt.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fechaDesde) {
      params.push(fechaDesde);
      sql += ` AND e.fecha >= $${params.length}`;
    }
    if (fechaHasta) {
      params.push(fechaHasta);
      sql += ` AND e.fecha <= $${params.length}`;
    }

    sql += ' ORDER BY e.fecha DESC';

    const data = await this.dataSource.query(sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Entradas');

    sheet.columns = [
      { header: 'N°', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 16 },
      { header: 'N° Guía', key: 'num_guia', width: 15 },
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Recurso', key: 'recurso', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Unidad', key: 'unidad', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Entrega', key: 'quien_entrega', width: 18 },
      { header: 'Recibe', key: 'quien_recibe', width: 18 },
      { header: 'Transporte', key: 'medio_transporte', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' },
    };

    data.forEach((row: any) => sheet.addRow(row));

    return workbook;
  }

  async generarExcelSalidas(fechaDesde?: string, fechaHasta?: string): Promise<ExcelJS.Workbook> {
    let sql = `
      SELECT s.id, s.fecha, s.num_registro, r.codigo, r.nombre as recurso, c.nombre as categoria,
             um.nombre as unidad, s.cantidad, ft.nombre as frente_trabajo,
             s.descripcion_trabajo, pe.nombre as quien_entrega, pr.nombre as quien_recibe
      FROM salidas s
      JOIN recursos r ON s.recurso_id = r.id
      JOIN categorias c ON r.categoria_id = c.id
      JOIN unidades_medida um ON r.unidad_medida_id = um.id
      LEFT JOIN frentes_trabajo ft ON s.frente_trabajo_id = ft.id
      LEFT JOIN personas pe ON s.quien_entrega_id = pe.id
      LEFT JOIN personas pr ON s.quien_recibe_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fechaDesde) {
      params.push(fechaDesde);
      sql += ` AND s.fecha >= $${params.length}`;
    }
    if (fechaHasta) {
      params.push(fechaHasta);
      sql += ` AND s.fecha <= $${params.length}`;
    }

    sql += ' ORDER BY s.fecha DESC';

    const data = await this.dataSource.query(sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Salidas');

    sheet.columns = [
      { header: 'N°', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 16 },
      { header: 'N° Registro', key: 'num_registro', width: 15 },
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Recurso', key: 'recurso', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Unidad', key: 'unidad', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Frente', key: 'frente_trabajo', width: 18 },
      { header: 'Descripción', key: 'descripcion_trabajo', width: 25 },
      { header: 'Entrega', key: 'quien_entrega', width: 18 },
      { header: 'Recibe', key: 'quien_recibe', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' },
    };

    data.forEach((row: any) => sheet.addRow(row));

    return workbook;
  }

  async generarPdfInventario(): Promise<Buffer> {
    const data = await this.dataSource.query('SELECT * FROM vista_inventario ORDER BY nombre ASC');

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).font('Helvetica-Bold').text('KardexChio - Inventario General', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
      doc.moveDown();

      const agotados = data.filter((r: any) => r.status === 'AGOTADO').length;
      doc.fontSize(10).text(`Total recursos: ${data.length} | Agotados: ${agotados}`);
      doc.moveDown();

      const headers = ['Código', 'Recurso', 'Categoría', 'Unidad', 'Entradas', 'Salidas', 'Existencia', 'Status'];
      const colWidths = [65, 230, 100, 60, 60, 60, 65, 80];
      let x = 30;
      const y = doc.y;

      doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 18).fill('#1E3A8A');
      headers.forEach((header, i) => {
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(header, x + 2, y + 4, { width: colWidths[i] - 4 });
        x += colWidths[i];
      });

      doc.y = y + 20;

      const maxRows = Math.min(data.length, 100);
      for (let r = 0; r < maxRows; r++) {
        const row = data[r];
        x = 30;

        if (doc.y > 550) {
          doc.addPage();
        }

        const bgColor = row.status === 'AGOTADO' ? '#FEE2E2' : (r % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        doc.rect(x, doc.y, colWidths.reduce((a, b) => a + b, 0), 14).fill(bgColor);

        const values = [row.codigo, row.nombre, row.categoria, row.unidad, row.total_entradas, row.total_salidas, row.existencia_actual, row.status];
        values.forEach((val, i) => {
          doc.fillColor('#111827').fontSize(7).font('Helvetica').text(String(val ?? ''), x + 2, doc.y + 2, { width: colWidths[i] - 4, lineBreak: false });
          x += colWidths[i];
        });

        doc.y += 14;
      }

      if (data.length > 100) {
        doc.moveDown();
        doc.fontSize(8).text(`... y ${data.length - 100} recursos más. Descargue el Excel para el listado completo.`);
      }

      doc.end();
    });
  }
}
