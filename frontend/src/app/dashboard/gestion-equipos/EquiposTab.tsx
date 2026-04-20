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
  codigo?: string;
  nombre: string;
  categoria: { id: number; nombre: string } | null;
  unidadMedida: { id: number; nombre: string } | null;
  estado?: string;
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
  const [form, setForm] = useState({ nombre: '', categoria_id: '', unidad_medida_id: '' });
  const [estadoEdit, setEstadoEdit] = useState('EN_ALMACEN');
  const [codigoPreview, setCodigoPreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data)).catch(console.error);
    api.get('/unidades-medida/activos').then(res => setUnidadesMedida(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const generatePreview = async () => {
      if (!form.nombre) {
        setCodigoPreview('');
        return;
      }
      try {
        const res = await api.get('/equipos/preview-codigo', {
          params: {
            nombre: form.nombre,
            ...(form.categoria_id && { categoria_id: form.categoria_id }),
          },
        });
        setCodigoPreview(res.data.preview);
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(generatePreview, 300);
    return () => clearTimeout(timer);
  }, [form.nombre, form.categoria_id]);

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
    setForm({ nombre: '', categoria_id: '', unidad_medida_id: '' });
    setCodigoPreview('');
    setFormError('');
    setModal(true);
  };

  const openEdit = (equipo: Equipo) => {
    setEditing(equipo);
    setForm({
      nombre: equipo.nombre,
      categoria_id: equipo.categoria?.id?.toString() || '',
      unidad_medida_id: equipo.unidadMedida?.id?.toString() || '',
    });
    setEstadoEdit(equipo.estado || 'EN_ALMACEN');
    setFormError('');
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload: Record<string, string | number> = { nombre: form.nombre };
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
    { header: 'Código', key: 'codigo', className: 'w-40' },
    { header: 'Nombre', key: 'nombre' },
    {
      header: 'Categoría', key: 'categoria',
      render: (item: Equipo) => item.categoria?.nombre || '-',
    },
    {
      header: 'Unidad', key: 'unidadMedida',
      render: (item: Equipo) => item.unidadMedida?.nombre || '-',
    },
    {
      header: 'Estado', key: 'estado',
      render: (item: Equipo) => <StatusBadge status={item.estado || 'EN_ALMACEN'} />,
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24 flex-shrink-0 text-center',
      render: (item: Equipo) => (
        <div className="flex items-center justify-center gap-1">
          {canEdit && (
            <button onClick={() => openEdit(item)} className="p-1.5 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1.5" title="Editar">
              <Pencil className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium">Editar</span>
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1.5" title="Eliminar">
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium">Eliminar</span>
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
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código (Automático)</label>
              <input
                type="text"
                value={codigoPreview || 'Escribe el nombre del equipo'}
                readOnly
                className="input-field bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
              className="input-field"
              required
              placeholder="ej: MONITOR DELL 24 PULGADAS"
            />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                value={estadoEdit}
                readOnly
                className="input-field bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">El estado se modifica mediante movimientos de equipos</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={formLoading || (!editing && !codigoPreview)}
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
