'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Pencil, Trash2, ShieldAlert, Tags } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export default function CategoriasPage() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ nombre: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editForm, setEditForm] = useState({ nombre: '', activo: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categorias');
      setCategorias(res.data);
    } catch {
      showError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchCategorias();
  }, [isAdmin, fetchCategorias]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tiene permisos para acceder a esta sección. Solo los administradores pueden gestionar categorías.</p>
      </div>
    );
  }

  const openNew = () => {
    setCreateForm({ nombre: '' });
    setCreateError('');
    setCreateModal(true);
  };

  const openEdit = (categoria: Categoria) => {
    setEditing(categoria);
    setEditForm({ nombre: categoria.nombre, activo: categoria.activo });
    setEditError('');
    setEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre.trim()) {
      setCreateError('El nombre es obligatorio');
      return;
    }
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/categorias', { nombre: createForm.nombre.trim() });
      setCreateModal(false);
      showSuccess('Categoría creada exitosamente');
      fetchCategorias();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(error.response?.data?.message || 'Error al crear categoría');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.nombre.trim()) {
      setEditError('El nombre es obligatorio');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      await api.put(`/categorias/${editing.id}`, {
        nombre: editForm.nombre.trim(),
        activo: editForm.activo,
      });
      setEditModal(false);
      showSuccess('Categoría actualizada');
      fetchCategorias();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta categoría');
    if (!confirmed) return;
    try {
      await api.delete(`/categorias/${id}`);
      showSuccess('Categoría eliminada');
      fetchCategorias();
    } catch {
      showError('Error al eliminar categoría');
    }
  };

  const columns = [
    {
      header: 'Nombre', key: 'nombre',
      render: (item: Categoria) => (
        <div className="flex items-center gap-2">
          <Tags className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{item.nombre}</span>
        </div>
      ),
    },
    {
      header: 'Estado', key: 'activo', className: 'w-28',
      render: (item: Categoria) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Fecha Registro', key: 'created_at', className: 'w-32', hideOnMobile: true,
      render: (item: Categoria) => new Date(item.created_at).toLocaleDateString('es-PE'),
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24 flex-shrink-0 text-center',
      render: (item: Categoria) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1.5" title="Editar">
            <Pencil className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Editar</span>
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1.5" title="Eliminar">
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Eliminar</span>
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
            {categorias.length} categorías registradas
            <span className="mx-1.5 text-gray-300">|</span>
            <span className="text-emerald-600 font-medium">{categorias.filter(c => c.activo).length} activas</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-red-500 font-medium">{categorias.filter(c => !c.activo).length} inactivas</span>
          </p>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Categoría
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={categorias} loading={loading} emptyMessage="No hay categorías registradas" />

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nueva Categoría">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{createError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre de la categoría"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
              {createLoading ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Categoría">
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{editError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre de la categoría"
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
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">Categoría activa</label>
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
