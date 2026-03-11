'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

interface FrenteTrabajo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
}

export default function FrentesTrabajoPage() {
  const { user } = useAuth();
  const [frentes, setFrentes] = useState<FrenteTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<FrenteTrabajo | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editForm, setEditForm] = useState({ codigo: '', nombre: '', descripcion: '', activo: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  const fetchFrentes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/frentes-trabajo');
      setFrentes(res.data);
    } catch {
      showError('Error al cargar frentes de trabajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchFrentes();
  }, [isAdmin, fetchFrentes]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tiene permisos para acceder a esta sección. Solo los administradores pueden gestionar frentes de trabajo.</p>
      </div>
    );
  }

  const openNew = () => {
    setCreateForm({ codigo: '', nombre: '', descripcion: '' });
    setCreateError('');
    setCreateModal(true);
  };

  const openEdit = (frente: FrenteTrabajo) => {
    setEditing(frente);
    setEditForm({
      codigo: frente.codigo,
      nombre: frente.nombre,
      descripcion: frente.descripcion || '',
      activo: frente.activo,
    });
    setEditError('');
    setEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/frentes-trabajo', {
        codigo: createForm.codigo,
        nombre: createForm.nombre,
        descripcion: createForm.descripcion || undefined,
      });
      setCreateModal(false);
      showSuccess('Frente de trabajo creado exitosamente');
      fetchFrentes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(error.response?.data?.message || 'Error al crear frente de trabajo');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditLoading(true);
    try {
      await api.put(`/frentes-trabajo/${editing.id}`, {
        codigo: editForm.codigo,
        nombre: editForm.nombre,
        descripcion: editForm.descripcion || undefined,
        activo: editForm.activo,
      });
      setEditModal(false);
      showSuccess('Frente de trabajo actualizado');
      fetchFrentes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || 'Error al actualizar frente de trabajo');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('este frente de trabajo');
    if (!confirmed) return;
    try {
      await api.delete(`/frentes-trabajo/${id}`);
      showSuccess('Frente de trabajo eliminado');
      fetchFrentes();
    } catch {
      showError('Error al eliminar frente de trabajo');
    }
  };

  const columns = [
    { header: 'Código', key: 'codigo', className: 'w-32' },
    { header: 'Nombre', key: 'nombre' },
    {
      header: 'Descripción', key: 'descripcion',
      render: (item: FrenteTrabajo) => item.descripcion
        ? <span className="text-gray-700">{item.descripcion}</span>
        : <span className="text-gray-400 italic">Sin descripción</span>,
    },
    {
      header: 'Estado', key: 'activo', className: 'w-28',
      render: (item: FrenteTrabajo) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24',
      render: (item: FrenteTrabajo) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {frentes.length} frentes de trabajo registrados
            <span className="mx-1.5 text-gray-300">|</span>
            <span className="text-emerald-600 font-medium">{frentes.filter(f => f.activo).length} activos</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-red-500 font-medium">{frentes.filter(f => !f.activo).length} inactivos</span>
          </p>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Frente de Trabajo
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={frentes} loading={loading} emptyMessage="No hay frentes de trabajo registrados" />

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nuevo Frente de Trabajo">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{createError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              value={createForm.codigo}
              onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })}
              className="input-field"
              required
              placeholder="FT-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre del frente de trabajo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              value={createForm.descripcion}
              onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Descripción del frente de trabajo"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
              {createLoading ? 'Guardando...' : 'Crear Frente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Frente de Trabajo">
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{editError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              value={editForm.codigo}
              onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
              className="input-field"
              required
              placeholder="FT-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre del frente de trabajo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              value={editForm.descripcion}
              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Descripción del frente de trabajo"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={editForm.activo}
              onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">Frente de trabajo activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={editLoading} className="btn-primary disabled:opacity-50">
              {editLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
