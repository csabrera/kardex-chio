'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Search, RefreshCw } from 'lucide-react';
import Select from 'react-select';

interface UbicacionRow {
  salida_id: number;
  equipo_id: number;
  codigo: string;
  equipo_nombre: string;
  tipo_salida: string;
  fecha: string;
  frente_trabajo: string;
  descripcion_trabajo: string;
  quien_entrega: string;
  quien_recibe: string;
  cantidad_enviada: number;
  cantidad_retornada: number;
  cantidad_pendiente: number;
  cerrada: boolean;
}

interface Equipo {
  id: number;
  nombre: string;
}

interface FrenteTrabajo {
  id: number;
  nombre: string;
}

interface UbicacionTabProps {
  frentesTrabajo: FrenteTrabajo[];
}

const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: '38px',
    borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    '&:hover': { borderColor: '#6366f1' },
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  singleValue: (base: Record<string, unknown>) => ({ ...base, fontSize: '0.875rem', color: '#111827' }),
  menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999, borderRadius: '0.5rem', fontSize: '0.875rem' }),
};

export default function UbicacionTab({ frentesTrabajo }: UbicacionTabProps) {
  const [data, setData] = useState<UbicacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoFilter, setEquipoFilter] = useState('');
  const [frenteFilter, setFrenteFilter] = useState('');
  const [tipoSalidaFilter, setTipoSalidaFilter] = useState('');
  const [mostrarCerradas, setMostrarCerradas] = useState(false);

  useEffect(() => {
    api.get('/equipos', { params: { limit: 200 } })
      .then(res => setEquipos(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (equipoFilter) params.equipo_id = equipoFilter;
      if (frenteFilter) params.frente_trabajo_id = frenteFilter;
      if (tipoSalidaFilter) params.tipo_salida = tipoSalidaFilter;
      if (mostrarCerradas) params.cerrada = 'true';
      const res = await api.get('/equipos/ubicacion', { params });
      setData(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [equipoFilter, frenteFilter, tipoSalidaFilter, mostrarCerradas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = search
    ? data.filter(row =>
        row.equipo_nombre.toLowerCase().includes(search.toLowerCase()) ||
        row.frente_trabajo?.toLowerCase().includes(search.toLowerCase()) ||
        row.codigo?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const columns = [
    { header: 'Código', key: 'codigo', className: 'whitespace-nowrap' },
    { header: 'Equipo', key: 'equipo_nombre' },
    {
      header: 'Tipo Salida', key: 'tipo_salida', className: 'whitespace-nowrap',
      render: (item: UbicacionRow) => <StatusBadge status={item.tipo_salida} />,
    },
    {
      header: 'Fecha Salida', key: 'fecha', className: 'whitespace-nowrap',
      render: (item: UbicacionRow) => new Date(item.fecha).toLocaleDateString('es-PE'),
    },
    { header: 'Frente de Trabajo', key: 'frente_trabajo', className: 'whitespace-nowrap' },
    {
      header: 'Enviado', key: 'cantidad_enviada', className: 'whitespace-nowrap text-center',
      render: (item: UbicacionRow) => <span className="font-medium">{item.cantidad_enviada}</span>,
    },
    {
      header: 'Retornado', key: 'cantidad_retornada', className: 'whitespace-nowrap text-center',
      render: (item: UbicacionRow) => <span className="text-green-600">{item.cantidad_retornada}</span>,
    },
    {
      header: 'Pendiente', key: 'cantidad_pendiente', className: 'whitespace-nowrap text-center',
      render: (item: UbicacionRow) => (
        <span className={`font-semibold ${item.cantidad_pendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>
          {item.cantidad_pendiente}
        </span>
      ),
    },
    {
      header: 'Estado', key: 'cerrada', className: 'whitespace-nowrap',
      render: (item: UbicacionRow) => <StatusBadge status={item.cerrada ? 'CERRADA' : 'EN_CAMPO'} />,
    },
    { header: 'Quién Recibe', key: 'quien_recibe', className: 'whitespace-nowrap', hideOnMobile: true },
  ];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar equipo o frente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="w-56">
            <Select
              options={equipos.map(e => ({ value: String(e.id), label: e.nombre }))}
              value={equipoFilter ? { value: equipoFilter, label: equipos.find(e => String(e.id) === equipoFilter)?.nombre || '' } : null}
              onChange={(opt) => setEquipoFilter(opt?.value || '')}
              placeholder="Filtrar equipo..."
              isClearable
              noOptionsMessage={() => 'Sin resultados'}
              classNamePrefix="rs"
              styles={selectStyles}
            />
          </div>
          <div className="w-52">
            <Select
              options={frentesTrabajo.map(ft => ({ value: String(ft.id), label: ft.nombre }))}
              value={frenteFilter ? { value: frenteFilter, label: frentesTrabajo.find(ft => String(ft.id) === frenteFilter)?.nombre || '' } : null}
              onChange={(opt) => setFrenteFilter(opt?.value || '')}
              placeholder="Filtrar frente..."
              isClearable
              noOptionsMessage={() => 'Sin resultados'}
              classNamePrefix="rs"
              styles={selectStyles}
            />
          </div>
          <select
            value={tipoSalidaFilter}
            onChange={(e) => setTipoSalidaFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Todos los tipos</option>
            <option value="PRESTAMO">Préstamo</option>
            <option value="ASIGNACION">Asignación</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarCerradas}
              onChange={(e) => setMostrarCerradas(e.target.checked)}
              className="rounded"
            />
            Incluir cerradas
          </label>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-indigo-600">{filtered.length}</p>
            <p className="text-sm text-gray-500 mt-1">Registros activos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">
              {filtered.reduce((sum, r) => sum + r.cantidad_pendiente, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Unidades en campo</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">
              {filtered.reduce((sum, r) => sum + r.cantidad_retornada, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Unidades retornadas</p>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={filtered} loading={loading} />
    </div>
  );
}
