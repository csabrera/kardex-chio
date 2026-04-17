'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

interface UnidadMedida {
  id: number;
  nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  categoria: { id: number; nombre: string } | null;
  unidadMedida: { id: number; nombre: string } | null;
  estado: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function EquiposTab() {
  const { user } = useAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Equipo | null>(null);
  const [form, setForm] = useState({ nombre: '', categoria_id: '', unidad_medida_id: '', estado: 'EN_ALMACEN' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data)).catch(console.error);
    api.get('/unidades-medida/activos').then(res => setUnidadesMedida(res.data)).catch(console.error);
  }, []);

  const fetchEquipos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (estadoFilter) params.estado = estadoFilter;
      const res = await api.get('/equipos', { params });
      setEquipos(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchEquipos, 300);
    return () => clearTimeout(timer);
  }, [fetchEquipos]);

  const openNew = () => {
    setEditing(null);
    setForm({ nombre: '', categoria_id: '', unidad_medida_id: '', estado: 'EN_ALMACEN' });
    setFormError('');
    setModal(true);
  };

  const openEdit = (equipo: Equipo) => {
    setEditing(equipo);
    setForm({
      nombre: equipo.nombre,
      categoria_id: equipo.categoria?.id?.toString() || '',
      unidad_medida_id: equipo.unidadMedida?.id?.toString() || '',
      estado: equipo.estado,
    });
    setFormError('');
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload: Record<string, string | number> = { nombre: form.nombre, estado: form.estado };
      if (form.categoria_id) payload.categoria_id = parseInt(form.categoria_id);
      if (form.unidad_medida_id) payload.unidad_medida_id = parseInt(form.unidad_medida_id);
      if (editing) {
        await api.put(`/equipos/${editing.id}`, payload);
      } else {
        await api.post('/equipos', payload);
      }
      setModal(false);
      showSuccess(editing ? 'Equipo actualizado' : 'Equipo creado exitosamente');
      fetchEquipos();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('este equipo');
    if (!confirmed) return;
    try {
      await api.delete(`/equipos/${id}`);
      showSuccess('Equipo eliminado');
      fetchEquipos();
    } catch {
      showError('Error al eliminar equipo');
    }
  };

  const columns = [
    { header: 'Nombre', key: 'nombre' },
    {
      header: 'Categoría', key: 'categoria', className: 'w-28',
      render: (item: Equipo) => item.categoria?.nombre || '-',
    },
    {
      header: 'Unidad', key: 'unidadMedida', className: 'w-20',
      render: (item: Equipo) => item.unidadMedida?.nombre || '-',
    },
    {
      header: 'Estado', key: 'estado', className: 'w-32',
      render: (item: Equipo) => <StatusBadge status={item.estado} />,
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24',
      render: (item: Equipo) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
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
              placeholder="Buscar equipo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            <option value="">Todos los estados</option>
            <option value="EN_ALMACEN">En Almacén</option>
            <option value="SALIDA">Salida</option>
            <option value="INGRESO">Ingreso</option>
          </select>
          {canEdit && (
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Equipo
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={equipos} loading={loading} rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Equipo' : 'Nuevo Equipo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
              <select
                value={form.unidad_medida_id}
                onChange={(e) => setForm({ ...form, unidad_medida_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sin unidad</option>
                {unidadesMedida.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="input-field"
            >
              <option value="EN_ALMACEN">En Almacén</option>
              <option value="SALIDA">Salida</option>
              <option value="INGRESO">Ingreso</option>
            </select>
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
