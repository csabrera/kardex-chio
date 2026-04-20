'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, Trash2 } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';
import Select from 'react-select';

interface Equipo {
  id: number;
  nombre: string;
  stock_disponible?: number;
}

interface Persona {
  id: number;
  nombre: string;
}

interface FrenteTrabajo {
  id: number;
  nombre: string;
}

interface SalidaEquipo {
  id: number;
  fecha: string;
  tipo_salida: string;
  cerrada: boolean;
  cantidad: number;
  cantidad_pendiente: number;
  descripcion_trabajo: string;
  equipo: { id: number; nombre: string };
  quienEntrega: { id: number; nombre: string } | null;
  quienRecibe: { id: number; nombre: string } | null;
  frenteTrabajo: { id: number; nombre: string } | null;
}

interface SalidaEquiposTabProps {
  personas: Persona[];
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

const TIPO_SALIDA_LABELS: Record<string, string> = {
  PRESTAMO: 'Préstamo',
  ASIGNACION: 'Asignación',
};

export default function SalidaEquiposTab({ personas, frentesTrabajo }: SalidaEquiposTabProps) {
  const { user } = useAuth();
  const [data, setData] = useState<SalidaEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoSalidaFilter, setTipoSalidaFilter] = useState('');
  const [cerradaFilter, setCerradaFilter] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    tipo_salida: 'PRESTAMO',
    equipo_id: '',
    cantidad: '1',
    frente_trabajo_id: '',
    descripcion_trabajo: '',
    quien_entrega_id: '',
    quien_recibe_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canCreate = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/equipos', { params: { limit: 200 } })
      .then(res => setEquipos(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.equipo_id) {
      const eq = equipos.find(e => String(e.id) === form.equipo_id);
      setStockDisponible(eq?.stock_disponible ?? null);
    } else {
      setStockDisponible(null);
    }
  }, [form.equipo_id, equipos]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (tipoSalidaFilter) params.tipo_salida = tipoSalidaFilter;
      if (cerradaFilter) params.cerrada = cerradaFilter;
      const res = await api.get('/salida-equipos', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search, fechaDesde, fechaHasta, tipoSalidaFilter, cerradaFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openNew = () => {
    setForm({
      tipo_salida: 'PRESTAMO',
      equipo_id: '',
      cantidad: '1',
      frente_trabajo_id: '',
      descripcion_trabajo: '',
      quien_entrega_id: '',
      quien_recibe_id: '',
    });
    setStockDisponible(null);
    setFormError('');
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.equipo_id) {
      setFormError('Debe seleccionar un equipo');
      return;
    }
    if (!form.frente_trabajo_id) {
      setFormError('El Frente de Trabajo es requerido');
      return;
    }
    const cantidad = parseInt(form.cantidad);
    if (!cantidad || cantidad < 1) {
      setFormError('La cantidad debe ser al menos 1');
      return;
    }
    if (stockDisponible !== null && cantidad > stockDisponible) {
      setFormError(`Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${cantidad}`);
      return;
    }
    setFormLoading(true);
    try {
      const payload: Record<string, string | number> = {
        tipo_salida: form.tipo_salida,
        equipo_id: parseInt(form.equipo_id),
        cantidad,
        frente_trabajo_id: parseInt(form.frente_trabajo_id),
      };
      if (form.descripcion_trabajo) payload.descripcion_trabajo = form.descripcion_trabajo;
      if (form.quien_entrega_id) payload.quien_entrega_id = parseInt(form.quien_entrega_id);
      if (form.quien_recibe_id) payload.quien_recibe_id = parseInt(form.quien_recibe_id);
      await api.post('/salida-equipos', payload);
      setModal(false);
      showSuccess('Salida de equipo registrada exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta salida de equipo');
    if (!confirmed) return;
    try {
      await api.delete(`/salida-equipos/${id}`);
      showSuccess('Salida de equipo eliminada');
      fetchData();
    } catch { showError('Error al eliminar salida de equipo'); }
  };

  const columns = [
    {
      header: 'Fecha', key: 'fecha', className: 'whitespace-nowrap',
      render: (item: SalidaEquipo) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      header: 'Tipo', key: 'tipo_salida', className: 'whitespace-nowrap',
      render: (item: SalidaEquipo) => <StatusBadge status={item.tipo_salida} />,
    },
    { header: 'Equipo', key: 'equipo', render: (item: SalidaEquipo) => item.equipo?.nombre || '-' },
    { header: 'Enviado', key: 'cantidad', className: 'whitespace-nowrap text-center' },
    {
      header: 'Pendiente', key: 'cantidad_pendiente', className: 'whitespace-nowrap text-center',
      render: (item: SalidaEquipo) => (
        <span className={item.cantidad_pendiente > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}>
          {item.cantidad_pendiente}
        </span>
      ),
    },
    {
      header: 'Estado', key: 'cerrada', className: 'whitespace-nowrap',
      render: (item: SalidaEquipo) => <StatusBadge status={item.cerrada ? 'CERRADA' : 'ABIERTA'} />,
    },
    { header: 'Frente de Trabajo', key: 'frenteTrabajo', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: SalidaEquipo) => item.frenteTrabajo?.nombre || '-' },
    { header: 'Descripción', key: 'descripcion_trabajo', hideOnMobile: true },
    { header: 'Quién Entrega', key: 'quienEntrega', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: SalidaEquipo) => item.quienEntrega?.nombre || '-' },
    { header: 'Quién Recibe', key: 'quienRecibe', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: SalidaEquipo) => item.quienRecibe?.nombre || '-' },
    {
      header: 'Acciones', key: 'actions', className: 'whitespace-nowrap text-center',
      render: (item: SalidaEquipo) => canDelete ? (
        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1.5" title="Eliminar">
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-sm font-medium">Eliminar</span>
        </button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por equipo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={tipoSalidaFilter}
            onChange={(e) => { setTipoSalidaFilter(e.target.value); setPage(1); }}
            className="input-field w-40"
          >
            <option value="">Todos los tipos</option>
            <option value="PRESTAMO">Préstamo</option>
            <option value="ASIGNACION">Asignación</option>
          </select>
          <select
            value={cerradaFilter}
            onChange={(e) => { setCerradaFilter(e.target.value); setPage(1); }}
            className="input-field w-36"
          >
            <option value="">Todas</option>
            <option value="false">Abiertas</option>
            <option value="true">Cerradas</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} className="input-field w-40" />
            <span className="text-gray-400">-</span>
            <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} className="input-field w-40" />
          </div>
          {canCreate && (
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nueva Salida
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={data} loading={loading} rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Salida de Equipo" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}

          {/* Tipo de salida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Salida <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {['PRESTAMO', 'ASIGNACION'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo_salida: tipo }))}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                    form.tipo_salida === tipo
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {TIPO_SALIDA_LABELS[tipo]}
                </button>
              ))}
            </div>
            {form.tipo_salida === 'PRESTAMO' && (
              <p className="text-xs text-gray-500 mt-1">El equipo se espera que sea devuelto.</p>
            )}
            {form.tipo_salida === 'ASIGNACION' && (
              <p className="text-xs text-gray-500 mt-1">Asignación permanente al frente de trabajo (puede devolverse al terminar la obra).</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo <span className="text-red-500">*</span></label>
              <Select
                options={equipos.map(eq => ({ value: String(eq.id), label: `${eq.nombre}${eq.stock_disponible !== undefined ? ` (Stock: ${eq.stock_disponible})` : ''}` }))}
                value={form.equipo_id ? { value: form.equipo_id, label: (() => { const eq = equipos.find(e => String(e.id) === form.equipo_id); return eq ? `${eq.nombre}${eq.stock_disponible !== undefined ? ` (Stock: ${eq.stock_disponible})` : ''}` : ''; })() } : null}
                onChange={(opt) => setForm(f => ({ ...f, equipo_id: opt?.value || '', cantidad: '1' }))}
                placeholder="Buscar equipo..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
              {stockDisponible !== null && (
                <p className={`text-xs mt-1 font-medium ${stockDisponible > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  Stock disponible: {stockDisponible}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frente de Trabajo <span className="text-red-500">*</span></label>
              <Select
                options={frentesTrabajo.map(ft => ({ value: String(ft.id), label: ft.nombre }))}
                value={form.frente_trabajo_id ? { value: form.frente_trabajo_id, label: frentesTrabajo.find(ft => String(ft.id) === form.frente_trabajo_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, frente_trabajo_id: opt?.value || '' })}
                placeholder="Buscar frente..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={form.descripcion_trabajo}
                onChange={(e) => setForm({ ...form, descripcion_trabajo: e.target.value })}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Entrega</label>
              <Select
                options={personas.map(p => ({ value: String(p.id), label: p.nombre }))}
                value={form.quien_entrega_id ? { value: form.quien_entrega_id, label: personas.find(p => String(p.id) === form.quien_entrega_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, quien_entrega_id: opt?.value || '' })}
                placeholder="Buscar persona..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Recibe</label>
              <Select
                options={personas.map(p => ({ value: String(p.id), label: p.nombre }))}
                value={form.quien_recibe_id ? { value: form.quien_recibe_id, label: personas.find(p => String(p.id) === form.quien_recibe_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, quien_recibe_id: opt?.value || '' })}
                placeholder="Buscar persona..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={formLoading || !form.equipo_id || !form.frente_trabajo_id || (stockDisponible !== null && stockDisponible <= 0)}
              className="btn-primary disabled:opacity-50"
            >
              {formLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
