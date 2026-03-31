import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getSummary() {
    const [
      totalRecursos,
      totalEntradas,
      totalSalidas,
      agotados,
      totalEquipos,
      categorias,
      movimientosRecientes,
      entradasPorMes,
      salidasPorMes,
    ] = await Promise.all([
      this.dataSource.query(
        'SELECT COUNT(*) as total FROM recursos WHERE activo = TRUE',
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as total, COALESCE(SUM(cantidad), 0) as cantidad_total FROM entradas',
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as total, COALESCE(SUM(cantidad), 0) as cantidad_total FROM salidas',
      ),
      this.dataSource.query(
        "SELECT COUNT(*) as total FROM vista_inventario WHERE status = 'AGOTADO'",
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as total FROM equipos WHERE activo = TRUE',
      ),
      this.dataSource.query(
        'SELECT c.nombre, COUNT(r.id) as total FROM categorias c LEFT JOIN recursos r ON c.id = r.categoria_id AND r.activo = TRUE WHERE c.activo = TRUE GROUP BY c.id, c.nombre ORDER BY total DESC',
      ),
      this.dataSource.query(`
        SELECT m.id, m.tipo, m.cantidad, m.fecha, m.descripcion, m.created_at,
               r.nombre as recurso_nombre, r.codigo as recurso_codigo,
               eq.nombre as equipo_nombre
        FROM movimientos m
        LEFT JOIN recursos r ON m.recurso_id = r.id
        LEFT JOIN equipos eq ON m.equipo_id = eq.id
        ORDER BY m.created_at DESC
        LIMIT 10
      `),
      this.dataSource.query(`
        SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, COUNT(*) as total, SUM(cantidad) as cantidad
        FROM entradas
        GROUP BY TO_CHAR(fecha, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      `),
      this.dataSource.query(`
        SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, COUNT(*) as total, SUM(cantidad) as cantidad
        FROM salidas
        GROUP BY TO_CHAR(fecha, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      `),
    ]);

    const alertas = await this.dataSource.query(`
      SELECT id, codigo, nombre, categoria, existencia_actual, status
      FROM vista_inventario
      WHERE status = 'AGOTADO'
      ORDER BY nombre ASC
      LIMIT 20
    `);

    return {
      resumen: {
        total_recursos: parseInt(totalRecursos[0].total),
        total_registros_entradas: parseInt(totalEntradas[0].total),
        cantidad_total_entradas: parseFloat(totalEntradas[0].cantidad_total),
        total_registros_salidas: parseInt(totalSalidas[0].total),
        cantidad_total_salidas: parseFloat(totalSalidas[0].cantidad_total),
        recursos_agotados: parseInt(agotados[0].total),
        total_equipos: parseInt(totalEquipos[0].total),
      },
      categorias,
      alertas,
      movimientos_recientes: movimientosRecientes,
      entradas_por_mes: entradasPorMes,
      salidas_por_mes: salidasPorMes,
    };
  }
}
