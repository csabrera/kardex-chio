'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { Search, Plus, Trash2 } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

interface Equipo {
  id: number;
  nombre: string;
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
  num_registro: string;
  cantidad: number;
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
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    num_registro: '',
    equipo_id: '',
    cantidad: '1',
    frente_trabajo_id: '',
    descripcion_trabajo: '',
    quien_entrega_id: '',
    quien_recibe_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Search selector for equipos
  const [equipoSearch, setEquipoSearch] = useState('');
  const [equiposSuggestions, setEquiposSuggestions] = useState<Equipo[]>([]);
  const [equipoDropdown, setEquipoDropdown] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const equipoRef = useRef<HTMLDivElement>(null);

  const canCreate = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/equipos').then(res => setEquipos(res.data)).catch(console.error);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (equipoRef.current && !equipoRef.current.contains(e.target as Node)) {
        setEquipoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search equipos while typing
  useEffect(() => {
    if (!equipoSearch || equipoSearch.length < 2) {
      setEquiposSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/equipos', { params: { search: equipoSearch, limit: 10 } });
        setEquiposSuggestions(Array.isArray(res.data) ? res.data : res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [equipoSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await api.get('/salida-equipos', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, fechaDesde, fechaHasta]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openNew = () => {
    setForm({
      fecha: new Date().toISOString().slice(0, 16),
      num_registro: '',
      equipo_id: '',
      cantidad: '1',
      frente_trabajo_id: '',
      descripcion_trabajo: '',
      quien_entrega_id: '',
      quien_recibe_id: '',
    });
    setEquipoSearch('');
    setSelectedEquipo(null);
    setFormError('');
    setModal(true);
  };

  const selectEquipo = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setForm({ ...form, equipo_id: String(equipo.id) });
    setEquipoSearch(equipo.nombre);
    setEquipoDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload: Record<string, string | number> = {
        fecha: form.fecha,
        num_registro: form.num_registro,
        equipo_id: parseInt(form.equipo_id),
        cantidad: parseInt(form.cantidad),
        descripcion_trabajo: form.descripcion_trabajo,
      };
      if (form.quien_entrega_id) payload.quien_entrega_id = parseInt(form.quien_entrega_id);
      if (form.quien_recibe_id) payload.quien_recibe_id = parseInt(form.quien_recibe_id);
      if (form.frente_trabajo_id) payload.frente_trabajo_id = parseInt(form.frente_trabajo_id);
      await api.post('/salida-equipos', payload);
      setModal(false);
      showSuccess('Salida de equipo registrada exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta salida de equipo');
    if (!confirmed) return;
    try {
      await api.delete(`/salida-equipos/${id}`);
      showSuccess('Salida de equipo eliminada');
      fetchData();
    } catch {
      showError('Error al eliminar salida de equipo');
    }
  };

  const columns = [
    {
      header: 'Fecha', key: 'fecha', className: 'w-36',
      render: (item: SalidaEquipo) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { header: 'N° Registro', key: 'num_registro', className: 'w-28' },
    {
      header: 'Equipo', key: 'equipo',
      render: (item: SalidaEquipo) => item.equipo?.nombre || '-',
    },
    { header: 'Cantidad', key: 'cantidad', className: 'w-24 text-center' },
    {
      header: 'Frente de Trabajo', key: 'frenteTrabajo',
      render: (item: SalidaEquipo) => item.frenteTrabajo?.nombre || '-',
    },
    { header: 'Descripción', key: 'descripcion_trabajo' },
    {
      header: 'Quién Entrega', key: 'quienEntrega', className: 'w-32',
      render: (item: SalidaEquipo) => item.quienEntrega?.nombre || '-',
    },
    {
      header: 'Quién Recibe', key: 'quienRecibe', className: 'w-32',
      render: (item: SalidaEquipo) => item.quienRecibe?.nombre || '-',
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-20',
      render: (item: SalidaEquipo) => canDelete ? (
        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
          <Trash2 className="w-4 h-4" />
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
              placeholder="Buscar por registro, equipo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="input-field w-40"
              placeholder="Desde"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="input-field w-40"
              placeholder="Hasta"
            />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Registro</label>
              <input
                type="text"
                value={form.num_registro}
                onChange={(e) => setForm({ ...form, num_registro: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div ref={equipoRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <input
                type="text"
                value={equipoSearch}
                onChange={(e) => {
                  setEquipoSearch(e.target.value);
                  setEquipoDropdown(true);
                  if (selectedEquipo) {
                    setSelectedEquipo(null);
                    setForm({ ...form, equipo_id: '' });
                  }
                }}
                onFocus={() => equipoSearch.length >= 2 && setEquipoDropdown(true)}
                className="input-field"
                placeholder="Escriba para buscar un equipo..."
                required
              />
              {equipoDropdown && equiposSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {equiposSuggestions.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => selectEquipo(eq)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 transition-colors"
                    >
                      <span className="font-medium text-gray-700">{eq.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
              {equipoDropdown && equipoSearch.length >= 2 && equiposSuggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-400 text-center">
                  No se encontraron equipos
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frente de Trabajo</label>
            <select
              value={form.frente_trabajo_id}
              onChange={(e) => setForm({ ...form, frente_trabajo_id: e.target.value })}
              className="input-field"
            >
              <option value="">Seleccionar frente de trabajo...</option>
              {frentesTrabajo.map(ft => <option key={ft.id} value={ft.id}>{ft.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo</label>
            <input
              type="text"
              value={form.descripcion_trabajo}
              onChange={(e) => setForm({ ...form, descripcion_trabajo: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Entrega</label>
              <select
                value={form.quien_entrega_id}
                onChange={(e) => setForm({ ...form, quien_entrega_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccionar persona...</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Recibe</label>
              <select
                value={form.quien_recibe_id}
                onChange={(e) => setForm({ ...form, quien_recibe_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccionar persona...</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={formLoading} className="btn-primary disabled:opacity-50">
              {formLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
