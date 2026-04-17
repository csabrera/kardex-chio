'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { Search, ArrowDownToLine, ArrowUpFromLine, Wrench } from 'lucide-react';

interface Movimiento {
  id: number;
  tipo: string;
  referencia_id: number;
  cantidad: number;
  fecha: string;
  descripcion: string;
  recurso: { nombre: string; codigo: string } | null;
  equipo: { nombre: string } | null;
  creator: { nombre: string; dni: string } | null;
}

const tipoBadgeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  ENTRADA: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: <ArrowDownToLine className="w-3.5 h-3.5" />,
    label: 'Entrada',
  },
  SALIDA: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: <ArrowUpFromLine className="w-3.5 h-3.5" />,
    label: 'Salida',
  },
  SALIDA_EQUIPO: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Wrench className="w-3.5 h-3.5" />,
    label: 'Salida Equipo',
  },
};

export default function MovimientosPage() {
  const [data, setData] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (tipoFilter) params.tipo = tipoFilter;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await api.get('/movimientos', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, tipoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const columns = [
    {
      header: 'Fecha', key: 'fecha',
      render: (item: Movimiento) => new Date(item.fecha).toLocaleDateString('es-PE'),
    },
    {
      header: 'Tipo', key: 'tipo',
      render: (item: Movimiento) => {
        const badge = tipoBadgeStyles[item.tipo];
        if (!badge) return item.tipo;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
            {badge.icon}
            {badge.label}
          </span>
        );
      },
    },
    {
      header: 'Recurso / Equipo', key: 'recurso', maxWidth: '250px',
      render: (item: Movimiento) => {
        if (item.recurso) return `${item.recurso.nombre} (${item.recurso.codigo})`;
        if (item.equipo) return item.equipo.nombre;
        return '-';
      },
    },
    {
      header: 'Cantidad', key: 'cantidad', className: 'text-center',
      render: (item: Movimiento) => (
        <span className={`font-medium ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : item.tipo === 'SALIDA' ? 'text-amber-600' : 'text-blue-600'}`}>
          {item.tipo === 'ENTRADA' ? '+' : '-'}{item.cantidad}
        </span>
      ),
    },
    { header: 'Descripción', key: 'descripcion', hideOnMobile: true },
    {
      header: 'Registrado por', key: 'creator', hideOnMobile: true,
      render: (item: Movimiento) => item.creator ? item.creator.nombre : '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="input-field w-48"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="SALIDA_EQUIPO">Salida Equipo</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="input-field w-40"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="input-field w-40"
            />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No hay movimientos registrados" rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
}
