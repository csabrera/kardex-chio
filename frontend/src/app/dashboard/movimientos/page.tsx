'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { Search, ArrowDownToLine, ArrowUpFromLine, Wrench, Package } from 'lucide-react';

interface Movimiento {
  id: number;
  tipo: string;
  referencia_id: number;
  cantidad: number;
  fecha: string;
  descripcion: string;
  recurso: { nombre: string; codigo: string } | null;
  equipo: { nombre: string } | null;
  creator: { nombre: string; documento: string } | null;
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
  ENTRADA_EQUIPO: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    icon: <Package className="w-3.5 h-3.5" />,
    label: 'Entrada Equipo',
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
      if (search) params.search = search;
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
  }, [page, search, tipoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const columns = [
    {
      header: 'Fecha & Hora', key: 'fecha', className: 'w-44',
      render: (item: Movimiento) => {
        const date = new Date(item.fecha);
        const fechaFormato = date.toLocaleDateString('es-PE');
        const horaFormato = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `${fechaFormato} ${horaFormato}`;
      },
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
      header: 'Recurso / Equipo', key: 'recurso', className: 'w-64',
      render: (item: Movimiento) => {
        if (item.recurso) return `${item.recurso.nombre} (${item.recurso.codigo})`;
        if (item.equipo) return item.equipo.nombre;
        return '-';
      },
    },
    {
      header: 'Cantidad', key: 'cantidad', className: 'text-center w-24',
      render: (item: Movimiento) => (
        <span className={`font-medium ${item.tipo === 'ENTRADA' || item.tipo === 'ENTRADA_EQUIPO' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {(item.tipo === 'ENTRADA' || item.tipo === 'ENTRADA_EQUIPO') ? '+' : '-'}{item.cantidad}
        </span>
      ),
    },
    { header: 'Descripción', key: 'descripcion', hideOnMobile: true, className: 'w-48' },
    {
      header: 'Registrado por', key: 'creator', hideOnMobile: true, className: 'w-48',
      render: (item: Movimiento) => item.creator ? `${item.creator.nombre} (${item.creator.documento})` : '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, descripción..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field flex-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="input-field w-48"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="ENTRADA_EQUIPO">Entrada Equipo</option>
            <option value="SALIDA_EQUIPO">Salida Equipo</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 font-medium">Rango:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="input-field w-40"
            />
            <span className="text-slate-400">-</span>
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
