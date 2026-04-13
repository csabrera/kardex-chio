import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportesService {
  constructor(private dataSource: DataSource) {}


  async generarExcelInventario(): Promise<ExcelJS.Workbook> {
    const data = await this.dataSource.query(
      'SELECT * FROM vista_inventario ORDER BY nombre ASC',
    );

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

  async generarExcelEntradas(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ExcelJS.Workbook> {
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

  async generarExcelSalidas(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ExcelJS.Workbook> {
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
    const data = await this.dataSource.query(
      'SELECT * FROM vista_inventario ORDER BY nombre ASC',
    );

    return new Promise((resolve) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('KardexChio - Inventario General', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, {
          align: 'center',
        });
      doc.moveDown();

      const agotados = data.filter((r: any) => r.status === 'AGOTADO').length;
      doc
        .fontSize(10)
        .text(`Total recursos: ${data.length} | Agotados: ${agotados}`);
      doc.moveDown();

      const headers = [
        'Código',
        'Recurso',
        'Categoría',
        'Unidad',
        'Entradas',
        'Salidas',
        'Existencia',
        'Status',
      ];
      const colWidths = [65, 230, 100, 60, 60, 60, 65, 80];
      let x = 30;
      const y = doc.y;

      doc
        .rect(
          x,
          y,
          colWidths.reduce((a, b) => a + b, 0),
          18,
        )
        .fill('#1E3A8A');
      headers.forEach((header, i) => {
        doc
          .fillColor('white')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(header, x + 2, y + 4, { width: colWidths[i] - 4 });
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

        const bgColor =
          row.status === 'AGOTADO'
            ? '#FEE2E2'
            : r % 2 === 0
              ? '#F9FAFB'
              : '#FFFFFF';
        doc
          .rect(
            x,
            doc.y,
            colWidths.reduce((a, b) => a + b, 0),
            14,
          )
          .fill(bgColor);

        const values = [
          row.codigo,
          row.nombre,
          row.categoria,
          row.unidad,
          row.total_entradas,
          row.total_salidas,
          row.existencia_actual,
          row.status,
        ];
        values.forEach((val, i) => {
          doc
            .fillColor('#111827')
            .fontSize(7)
            .font('Helvetica')
            .text(String(val ?? ''), x + 2, doc.y + 2, {
              width: colWidths[i] - 4,
              lineBreak: false,
            });
          x += colWidths[i];
        });

        doc.y += 14;
      }

      if (data.length > 100) {
        doc.moveDown();
        doc
          .fontSize(8)
          .text(
            `... y ${data.length - 100} recursos más. Descargue el Excel para el listado completo.`,
          );
      }

      doc.end();
    });
  }

  async generarPdfEntradas(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<Buffer> {
    let sql = `
      SELECT e.fecha, e.num_guia, r.nombre as recurso, e.cantidad,
             pe.nombre as quien_entrega, pr.nombre as quien_recibe,
             mt.nombre as medio_transporte
      FROM entradas e
      JOIN recursos r ON e.recurso_id = r.id
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

    const now = new Date();
    const generatedDate = now.toLocaleDateString('es-PE');
    const generatedTime = now.toLocaleTimeString('es-PE');
    const desde = fechaDesde ? new Date(fechaDesde).toLocaleDateString('es-PE') : 'Inicio';
    const hasta = fechaHasta ? new Date(fechaHasta).toLocaleDateString('es-PE') : 'Hoy';

    const tableRows = data
      .slice(0, 100)
      .map(
        (row: any) => `
      <tr>
        <td>${new Date(row.fecha).toLocaleDateString('es-PE')}</td>
        <td>${row.num_guia || '-'}</td>
        <td>${row.recurso || '-'}</td>
        <td style="text-align: center;">${row.cantidad || '-'}</td>
        <td>${row.quien_entrega || '-'}</td>
        <td>${row.quien_recibe || '-'}</td>
        <td>${row.medio_transporte || '-'}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; }

        .header {
          background: linear-gradient(135deg, #1E3A8A 0%, #2E5090 100%);
          padding: 30px 40px;
          color: white;
        }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .header p { font-size: 12px; opacity: 0.9; }

        .metadata {
          padding: 20px 40px;
          background: #f8f9fa;
          border-bottom: 2px solid #1E3A8A;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 10px;
        }
        .info {
          font-size: 11px;
          color: #555;
          line-height: 1.6;
        }
        .info strong { color: #1E3A8A; }

        .content {
          padding: 40px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        th {
          background: #1E3A8A;
          color: white;
          padding: 12px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          border: 1px solid #1E3A8A;
        }

        td {
          padding: 11px 10px;
          font-size: 11px;
          border: 1px solid #e0e0e0;
        }

        tr:nth-child(odd) { background: #F0FDF4; }
        tr:nth-child(even) { background: #ffffff; }
        tr:hover { background: #E8F5E9; }

        .footer {
          padding: 20px 40px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #777;
          background: #fafafa;
        }

        .summary {
          padding: 15px 40px;
          background: #E3F2FD;
          border-left: 4px solid #1E3A8A;
          font-size: 12px;
          font-weight: 600;
          color: #1E3A8A;
        }

        .warning {
          padding: 10px 40px;
          background: #FFF3E0;
          color: #E65100;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KardexChio</h1>
        <p>Sistema de Control de Almacén</p>
      </div>

      <div class="metadata">
        <div class="title">Reporte de Entradas</div>
        <div class="info">
          <strong>Generado:</strong> ${generatedDate} a las ${generatedTime}<br>
          <strong>Período:</strong> ${desde} - ${hasta}<br>
          <strong>Total de registros:</strong> ${data.length}
        </div>
      </div>

      <div class="content">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N° Guía</th>
              <th>Recurso</th>
              <th style="text-align: center;">Cantidad</th>
              <th>Entrega</th>
              <th>Recibe</th>
              <th>Transporte</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${data.length > 100 ? `<div class="warning">⚠ ... y ${data.length - 100} registros más. Descargue el Excel para ver todos.</div>` : ''}
      </div>

      <div class="footer">
        <p>KardexChio © 2026 - Sistema de Control de Almacén<br>Reporte generado automáticamente</p>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  async generarPdfSalidas(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<Buffer> {
    let sql = `
      SELECT s.fecha, s.num_registro, r.nombre as recurso, s.cantidad,
             ft.nombre as frente_trabajo, s.descripcion_trabajo,
             pe.nombre as quien_entrega, pr.nombre as quien_recibe
      FROM salidas s
      JOIN recursos r ON s.recurso_id = r.id
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

    const now = new Date();
    const generatedDate = now.toLocaleDateString('es-PE');
    const generatedTime = now.toLocaleTimeString('es-PE');
    const desde = fechaDesde ? new Date(fechaDesde).toLocaleDateString('es-PE') : 'Inicio';
    const hasta = fechaHasta ? new Date(fechaHasta).toLocaleDateString('es-PE') : 'Hoy';

    const tableRows = data
      .slice(0, 100)
      .map(
        (row: any) => `
      <tr>
        <td>${new Date(row.fecha).toLocaleDateString('es-PE')}</td>
        <td>${row.num_registro || '-'}</td>
        <td>${row.recurso || '-'}</td>
        <td style="text-align: center;">${row.cantidad || '-'}</td>
        <td>${row.frente_trabajo || '-'}</td>
        <td>${row.descripcion_trabajo || '-'}</td>
        <td>${row.quien_entrega || '-'}</td>
        <td>${row.quien_recibe || '-'}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; }

        .header {
          background: linear-gradient(135deg, #1E3A8A 0%, #2E5090 100%);
          padding: 30px 40px;
          color: white;
        }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .header p { font-size: 12px; opacity: 0.9; }

        .metadata {
          padding: 20px 40px;
          background: #f8f9fa;
          border-bottom: 2px solid #1E3A8A;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 10px;
        }
        .info {
          font-size: 11px;
          color: #555;
          line-height: 1.6;
        }
        .info strong { color: #1E3A8A; }

        .content {
          padding: 40px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        th {
          background: #1E3A8A;
          color: white;
          padding: 12px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          border: 1px solid #1E3A8A;
        }

        td {
          padding: 11px 10px;
          font-size: 11px;
          border: 1px solid #e0e0e0;
        }

        tr:nth-child(odd) { background: #FFFBEB; }
        tr:nth-child(even) { background: #ffffff; }
        tr:hover { background: #FFF8DC; }

        .footer {
          padding: 20px 40px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #777;
          background: #fafafa;
        }

        .summary {
          padding: 15px 40px;
          background: #E3F2FD;
          border-left: 4px solid #1E3A8A;
          font-size: 12px;
          font-weight: 600;
          color: #1E3A8A;
        }

        .warning {
          padding: 10px 40px;
          background: #FFF3E0;
          color: #E65100;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KardexChio</h1>
        <p>Sistema de Control de Almacén</p>
      </div>

      <div class="metadata">
        <div class="title">Reporte de Salidas</div>
        <div class="info">
          <strong>Generado:</strong> ${generatedDate} a las ${generatedTime}<br>
          <strong>Período:</strong> ${desde} - ${hasta}<br>
          <strong>Total de registros:</strong> ${data.length}
        </div>
      </div>

      <div class="content">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N° Registro</th>
              <th>Recurso</th>
              <th style="text-align: center;">Cantidad</th>
              <th>Frente</th>
              <th>Descripción</th>
              <th>Entrega</th>
              <th>Recibe</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${data.length > 100 ? `<div class="warning">⚠ ... y ${data.length - 100} registros más. Descargue el Excel para ver todos.</div>` : ''}
      </div>

      <div class="footer">
        <p>KardexChio © 2026 - Sistema de Control de Almacén<br>Reporte generado automáticamente</p>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}
