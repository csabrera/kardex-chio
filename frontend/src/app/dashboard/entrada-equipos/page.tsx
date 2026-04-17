'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface EntradaEquipo {
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

export default function EntradaEquiposPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EntradaEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [frentesTrabajo, setFrentesTrabajo] = useState<FrenteTrabajo[]>([]);
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

  const canCreate = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/equipos').then(res => setEquipos(res.data)).catch(console.error);
    api.get('/personas/activos').then(res => setPersonas(res.data)).catch(console.error);
    api.get('/frentes-trabajo/activos').then(res => setFrentesTrabajo(res.data)).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await api.get('/entrada-equipos', { params });
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
    setFormError('');
    setModal(true);
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
      await api.post('/entrada-equipos', payload);
      setModal(false);
      showSuccess('Entrada de equipo registrada exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta entrada de equipo');
    if (!confirmed) return;
    try {
      await api.delete(`/entrada-equipos/${id}`);
      showSuccess('Entrada de equipo eliminada');
      fetchData();
    } catch {
      showError('Error al eliminar entrada de equipo');
    }
  };

  const columns = [
    {
      header: 'Fecha', key: 'fecha', className: 'w-36',
      render: (item: EntradaEquipo) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { header: 'N° Registro', key: 'num_registro', className: 'w-28' },
    {
      header: 'Equipo', key: 'equipo', maxWidth: '250px',
      render: (item: EntradaEquipo) => item.equipo?.nombre || '-',
    },
    { header: 'Cantidad', key: 'cantidad', className: 'w-24 text-center' },
    {
      header: 'Frente de Trabajo', key: 'frenteTrabajo', hideOnMobile: true,
      render: (item: EntradaEquipo) => item.frenteTrabajo?.nombre || '-',
    },
    { header: 'Descripción', key: 'descripcion_trabajo', hideOnMobile: true },
    {
      header: 'Quién Entrega', key: 'quienEntrega', hideOnMobile: true,
      render: (item: EntradaEquipo) => item.quienEntrega?.nombre || '-',
    },
    {
      header: 'Quién Recibe', key: 'quienRecibe', hideOnMobile: true,
      render: (item: EntradaEquipo) => item.quienRecibe?.nombre || '-',
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24 flex-shrink-0 text-center',
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
              <Plus className="w-4 h-4" /> Nueva Entrada
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={data} loading={loading} rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Entrada de Equipo" maxWidth="max-w-2xl">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select
                value={form.equipo_id}
                onChange={(e) => setForm({ ...form, equipo_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar equipo...</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
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
