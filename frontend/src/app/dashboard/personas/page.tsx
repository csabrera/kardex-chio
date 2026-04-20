'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

const TIPOS_PERSONA = [
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'TRABAJADOR', label: 'Trabajador' },
  { value: 'TRANSPORTISTA', label: 'Transportista' },
];

interface Persona {
  id: number;
  tipo: string;
  nombre: string;
  documento: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
}

export default function PersonasPage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ tipo: 'PROVEEDOR', nombre: '', documento: '', email: '', telefono: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editForm, setEditForm] = useState({ tipo: 'PROVEEDOR', nombre: '', documento: '', email: '', telefono: '', activo: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtroTipo ? { tipo: filtroTipo } : {};
      const res = await api.get('/personas', { params });
      setPersonas(res.data);
    } catch {
      showError('Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    if (isAdmin) fetchPersonas();
  }, [isAdmin, fetchPersonas]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tiene permisos para acceder a esta sección. Solo los administradores pueden gestionar personas.</p>
      </div>
    );
  }

  const openNew = () => {
    setCreateForm({ tipo: 'PROVEEDOR', nombre: '', documento: '', email: '', telefono: '' });
    setCreateError('');
    setCreateModal(true);
  };

  const openEdit = (persona: Persona) => {
    setEditing(persona);
    setEditForm({
      tipo: persona.tipo,
      nombre: persona.nombre,
      documento: persona.documento || '',
      email: persona.email || '',
      telefono: persona.telefono || '',
      activo: persona.activo,
    });
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
      await api.post('/personas', {
        tipo: createForm.tipo,
        nombre: createForm.nombre.trim(),
        documento: createForm.documento.trim() || undefined,
        email: createForm.email.trim() || undefined,
        telefono: createForm.telefono.trim() || undefined,
      });
      setCreateModal(false);
      showSuccess('Persona creada exitosamente');
      fetchPersonas();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(error.response?.data?.message || 'Error al crear persona');
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
      await api.put(`/personas/${editing.id}`, {
        tipo: editForm.tipo,
        nombre: editForm.nombre.trim(),
        documento: editForm.documento.trim() || undefined,
        email: editForm.email.trim() || undefined,
        telefono: editForm.telefono.trim() || undefined,
        activo: editForm.activo,
      });
      setEditModal(false);
      showSuccess('Persona actualizada');
      fetchPersonas();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta persona');
    if (!confirmed) return;
    try {
      await api.delete(`/personas/${id}`);
      showSuccess('Persona eliminada');
      fetchPersonas();
    } catch {
      showError('Error al eliminar persona');
    }
  };

  const tipoBadge = (tipo: string) => {
    const styles: Record<string, string> = {
      PROVEEDOR: 'bg-blue-100 text-blue-700',
      TRABAJADOR: 'bg-emerald-100 text-emerald-700',
      TRANSPORTISTA: 'bg-amber-100 text-amber-700',
    };
    const labels: Record<string, string> = {
      PROVEEDOR: 'Proveedor',
      TRABAJADOR: 'Trabajador',
      TRANSPORTISTA: 'Transportista',
    };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[tipo] || 'bg-gray-100 text-gray-700'}`}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  const columns = [
    {
      header: 'Tipo', key: 'tipo', className: 'w-32', hideOnMobile: true,
      render: (item: Persona) => tipoBadge(item.tipo),
    },
    { header: 'Nombre', key: 'nombre' },
    { header: 'Documento', key: 'documento', className: 'w-32',
      render: (item: Persona) => item.documento || <span className="text-gray-400 italic">-</span>,
    },
    { header: 'Email', key: 'email', hideOnMobile: true,
      render: (item: Persona) => item.email || <span className="text-gray-400 italic">-</span>,
    },
    { header: 'Teléfono', key: 'telefono', className: 'w-32', hideOnMobile: true,
      render: (item: Persona) => item.telefono || <span className="text-gray-400 italic">-</span>,
    },
    {
      header: 'Estado', key: 'activo', className: 'w-28',
      render: (item: Persona) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-24 flex-shrink-0 text-center',
      render: (item: Persona) => (
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
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              {personas.length} personas registradas
              <span className="mx-1.5 text-gray-300">|</span>
              <span className="text-emerald-600 font-medium">{personas.filter(p => p.activo).length} activas</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="text-red-500 font-medium">{personas.filter(p => !p.activo).length} inactivas</span>
            </p>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="input-field w-48"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_PERSONA.map(tp => (
                <option key={tp.value} value={tp.value}>{tp.label}</option>
              ))}
            </select>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Persona
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={personas} loading={loading} emptyMessage="No hay personas registradas" />

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nueva Persona">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{createError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={createForm.tipo}
              onChange={(e) => setCreateForm({ ...createForm, tipo: e.target.value })}
              className="input-field"
            >
              {TIPOS_PERSONA.map(tp => (
                <option key={tp.value} value={tp.value}>{tp.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre completo o razón social"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento <span className="text-gray-400">(opcional)</span></label>
            <input
              type="text"
              value={createForm.documento}
              onChange={(e) => setCreateForm({ ...createForm, documento: e.target.value })}
              className="input-field"
              placeholder="RUC, DNI, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(opcional)</span></label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="input-field"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400">(opcional)</span></label>
            <input
              type="text"
              value={createForm.telefono}
              onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
              className="input-field"
              placeholder="999 999 999"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
              {createLoading ? 'Guardando...' : 'Crear Persona'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Persona">
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{editError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={editForm.tipo}
              onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
              className="input-field"
            >
              {TIPOS_PERSONA.map(tp => (
                <option key={tp.value} value={tp.value}>{tp.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="input-field"
              required
              placeholder="Nombre completo o razón social"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento <span className="text-gray-400">(opcional)</span></label>
            <input
              type="text"
              value={editForm.documento}
              onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
              className="input-field"
              placeholder="RUC, DNI, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(opcional)</span></label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="input-field"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400">(opcional)</span></label>
            <input
              type="text"
              value={editForm.telefono}
              onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
              className="input-field"
              placeholder="999 999 999"
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
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">Persona activa</label>
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
