'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, Trash2, Package, RotateCcw } from 'lucide-react';
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
  tipo?: string;
}

interface SalidaAbierta {
  id: number;
  fecha: string;
  tipo_salida: string;
  cantidad: number;
  frente_trabajo: string;
  cantidad_pendiente: number;
}

interface EntradaEquipo {
  id: number;
  fecha: string;
  tipo_entrada: string;
  cantidad: number;
  descripcion_trabajo: string;
  equipo: { id: number; nombre: string };
  quienEntrega: { id: number; nombre: string } | null;
  quienRecibe: { id: number; nombre: string } | null;
  frenteTrabajo: { id: number; nombre: string } | null;
  salidaOrigen: { id: number; fecha: string; tipo_salida: string; frenteTrabajo: { nombre: string } | null } | null;
}

interface EntradaEquiposTabProps {
  personas: Persona[];
  frentesTrabajo: { id: number; nombre: string }[];
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

export default function EntradaEquiposTab({ personas }: EntradaEquiposTabProps) {
  const { user } = useAuth();
  const [data, setData] = useState<EntradaEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoEntradaFilter, setTipoEntradaFilter] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [salidasAbiertas, setSalidasAbiertas] = useState<SalidaAbierta[]>([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    tipo_entrada: 'ADQUISICION',
    equipo_id: '',
    salida_equipo_id: '',
    cantidad: '1',
    observaciones: '',
    quien_entrega_id: '',
    quien_recibe_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canCreate = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  const proveedores = personas.filter(p => p.tipo === 'PROVEEDOR');
  const trabajadores = personas.filter(p => p.tipo !== 'PROVEEDOR');

  useEffect(() => {
    api.get('/equipos', { params: { limit: 200 } })
      .then(res => setEquipos(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.tipo_entrada === 'RETORNO' && form.equipo_id) {
      setLoadingSalidas(true);
      setSalidasAbiertas([]);
      api.get(`/salida-equipos/abiertas/${form.equipo_id}`)
        .then(res => setSalidasAbiertas(res.data))
        .catch(console.error)
        .finally(() => setLoadingSalidas(false));
    } else {
      setSalidasAbiertas([]);
    }
  }, [form.tipo_entrada, form.equipo_id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (tipoEntradaFilter) params.tipo_entrada = tipoEntradaFilter;
      const res = await api.get('/entrada-equipos', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search, fechaDesde, fechaHasta, tipoEntradaFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openNew = () => {
    setForm({
      tipo_entrada: 'ADQUISICION',
      equipo_id: '',
      salida_equipo_id: '',
      cantidad: '1',
      observaciones: '',
      quien_entrega_id: '',
      quien_recibe_id: '',
    });
    setSalidasAbiertas([]);
    setFormError('');
    setModal(true);
  };

  const handleEquipoChange = (equipoId: string) => {
    setForm(f => ({ ...f, equipo_id: equipoId, salida_equipo_id: '' }));
  };

  const handleTipoEntradaChange = (tipo: string) => {
    setForm(f => ({ ...f, tipo_entrada: tipo, salida_equipo_id: '', quien_entrega_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.tipo_entrada === 'RETORNO' && !form.salida_equipo_id) {
      setFormError('Debe seleccionar la salida de origen para registrar una devolución');
      return;
    }
    setFormLoading(true);
    try {
      const payload: Record<string, string | number> = {
        tipo_entrada: form.tipo_entrada,
        equipo_id: parseInt(form.equipo_id),
        cantidad: parseInt(form.cantidad),
      };
      if (form.observaciones) payload.descripcion_trabajo = form.observaciones;
      if (form.quien_entrega_id) payload.quien_entrega_id = parseInt(form.quien_entrega_id);
      if (form.quien_recibe_id) payload.quien_recibe_id = parseInt(form.quien_recibe_id);
      if (form.tipo_entrada === 'RETORNO' && form.salida_equipo_id) {
        payload.salida_equipo_id = parseInt(form.salida_equipo_id);
      }
      await api.post('/entrada-equipos', payload);
      setModal(false);
      showSuccess('Registro de entrada guardado exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('este registro de entrada');
    if (!confirmed) return;
    try {
      await api.delete(`/entrada-equipos/${id}`);
      showSuccess('Registro eliminado');
      fetchData();
    } catch { showError('Error al eliminar el registro'); }
  };

  const selectedSalidaAbierta = salidasAbiertas.find(s => String(s.id) === form.salida_equipo_id);

  const tipoLabel = (tipo: string) => tipo === 'ADQUISICION' ? 'Compra/Ingreso' : 'Devolución';

  const columns = [
    {
      header: 'Fecha', key: 'fecha', className: 'whitespace-nowrap',
      render: (item: EntradaEquipo) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      header: 'Tipo', key: 'tipo_entrada', className: 'whitespace-nowrap',
      render: (item: EntradaEquipo) => <StatusBadge status={item.tipo_entrada} />,
    },
    { header: 'Equipo', key: 'equipo', render: (item: EntradaEquipo) => item.equipo?.nombre || '-' },
    { header: 'Cant.', key: 'cantidad', className: 'whitespace-nowrap text-center' },
    {
      header: 'Salida origen', key: 'salidaOrigen', className: 'whitespace-nowrap', hideOnMobile: true,
      render: (item: EntradaEquipo) => item.salidaOrigen
        ? `#${item.salidaOrigen.id} — ${item.salidaOrigen.frenteTrabajo?.nombre || item.salidaOrigen.tipo_salida}`
        : '—',
    },
    { header: 'Observaciones', key: 'descripcion_trabajo', hideOnMobile: true },
    { header: 'Entregado por', key: 'quienEntrega', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: EntradaEquipo) => item.quienEntrega?.nombre || '—' },
    { header: 'Recibido por', key: 'quienRecibe', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: EntradaEquipo) => item.quienRecibe?.nombre || '—' },
    {
      header: 'Acciones', key: 'actions', className: 'whitespace-nowrap text-center',
      render: (item: EntradaEquipo) => canDelete ? (
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
            value={tipoEntradaFilter}
            onChange={(e) => { setTipoEntradaFilter(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            <option value="">Todos los tipos</option>
            <option value="ADQUISICION">Compra / Ingreso</option>
            <option value="RETORNO">Devolución</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} className="input-field w-40" />
            <span className="text-gray-400">—</span>
            <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} className="input-field w-40" />
          </div>
          {canCreate && (
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar Entrada
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={data} loading={loading} rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Entrada de Equipo" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}

          {/* Selector de tipo con tarjetas visuales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo ingresa el equipo? <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoEntradaChange('ADQUISICION')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.tipo_entrada === 'ADQUISICION'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Package className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Compra / Ingreso</p>
                  <p className="text-xs opacity-70 mt-0.5">Equipo nuevo al almacén</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTipoEntradaChange('RETORNO')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.tipo_entrada === 'RETORNO'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <RotateCcw className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Devolución desde Campo</p>
                  <p className="text-xs opacity-70 mt-0.5">Regresa de un frente de trabajo</p>
                </div>
              </button>
            </div>
          </div>

          {/* Equipo y Cantidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo <span className="text-red-500">*</span></label>
              <Select
                options={equipos.map(eq => ({ value: String(eq.id), label: eq.nombre }))}
                value={form.equipo_id ? { value: form.equipo_id, label: equipos.find(eq => String(eq.id) === form.equipo_id)?.nombre || '' } : null}
                onChange={(opt) => handleEquipoChange(opt?.value || '')}
                placeholder="Buscar equipo..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="input-field"
                min="1"
                max={selectedSalidaAbierta ? selectedSalidaAbierta.cantidad_pendiente : undefined}
                required
              />
              {selectedSalidaAbierta && (
                <p className="text-xs text-amber-600 mt-1">
                  Máximo a devolver: {selectedSalidaAbierta.cantidad_pendiente} unidad(es)
                </p>
              )}
            </div>
          </div>

          {/* Selector de salida origen — solo para RETORNO */}
          {form.tipo_entrada === 'RETORNO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿De qué salida retorna? <span className="text-red-500">*</span>
              </label>
              {!form.equipo_id ? (
                <p className="text-sm text-gray-400 italic">Primero selecciona el equipo</p>
              ) : loadingSalidas ? (
                <p className="text-sm text-gray-400 italic">Buscando salidas abiertas...</p>
              ) : salidasAbiertas.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                  Este equipo no tiene salidas pendientes de devolución
                </div>
              ) : (
                <Select
                  options={salidasAbiertas.map(s => ({
                    value: String(s.id),
                    label: `${s.frente_trabajo} — ${s.tipo_salida === 'PRESTAMO' ? 'Préstamo' : 'Asignación'} — Pendiente: ${s.cantidad_pendiente} und.`,
                  }))}
                  value={form.salida_equipo_id
                    ? {
                        value: form.salida_equipo_id,
                        label: (() => {
                          const s = salidasAbiertas.find(x => String(x.id) === form.salida_equipo_id);
                          return s ? `${s.frente_trabajo} — ${s.tipo_salida === 'PRESTAMO' ? 'Préstamo' : 'Asignación'} — Pendiente: ${s.cantidad_pendiente} und.` : '';
                        })(),
                      }
                    : null}
                  onChange={(opt) => setForm(f => ({ ...f, salida_equipo_id: opt?.value || '' }))}
                  placeholder="Seleccionar salida a devolver..."
                  noOptionsMessage={() => 'Sin resultados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              )}
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
              <span className="text-gray-400 font-normal ml-1 text-xs">
                {form.tipo_entrada === 'ADQUISICION' ? '(ej: N° factura, proveedor)' : '(ej: condición del equipo al retornar)'}
              </span>
            </label>
            <input
              type="text"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              className="input-field"
              placeholder="Opcional"
            />
          </div>

          {/* Entregado / Recibido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.tipo_entrada === 'ADQUISICION' ? 'Proveedor / Quien entrega' : 'Quien devuelve'}
              </label>
              {form.tipo_entrada === 'ADQUISICION' ? (
                <Select
                  key="entrega-prov"
                  options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  value={form.quien_entrega_id ? { value: form.quien_entrega_id, label: proveedores.find(p => String(p.id) === form.quien_entrega_id)?.nombre || '' } : null}
                  onChange={(opt) => setForm(f => ({ ...f, quien_entrega_id: opt?.value || '' }))}
                  placeholder="Buscar proveedor..."
                  isClearable
                  noOptionsMessage={() => 'Sin proveedores registrados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              ) : (
                <Select
                  key="entrega-trab"
                  options={trabajadores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  value={form.quien_entrega_id ? { value: form.quien_entrega_id, label: trabajadores.find(p => String(p.id) === form.quien_entrega_id)?.nombre || '' } : null}
                  onChange={(opt) => setForm(f => ({ ...f, quien_entrega_id: opt?.value || '' }))}
                  placeholder="Buscar trabajador..."
                  isClearable
                  noOptionsMessage={() => 'Sin resultados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                {form.tipo_entrada === 'ADQUISICION' ? 'Solo muestra proveedores' : 'Solo muestra trabajadores'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recibido por (almacén)</label>
              <Select
                options={trabajadores.map(p => ({ value: String(p.id), label: p.nombre }))}
                value={form.quien_recibe_id ? { value: form.quien_recibe_id, label: trabajadores.find(p => String(p.id) === form.quien_recibe_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, quien_recibe_id: opt?.value || '' })}
                placeholder="Buscar trabajador..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
              <p className="text-xs text-gray-400 mt-1">Solo muestra trabajadores</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={
                formLoading || !form.equipo_id ||
                (form.tipo_entrada === 'RETORNO' && (!form.salida_equipo_id || salidasAbiertas.length === 0))
              }
              className="btn-primary disabled:opacity-50"
            >
              {formLoading ? 'Guardando...' : `Registrar ${tipoLabel(form.tipo_entrada)}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
