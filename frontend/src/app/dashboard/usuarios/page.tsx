'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Pencil, Trash2, ShieldAlert, RotateCcw } from 'lucide-react';
import { showSuccess, showError, confirmDelete, confirmAction } from '@/lib/swal';

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI', maxLength: 8, pattern: /^\d{8}$/, placeholder: '12345678' },
  { value: 'CE', label: 'Carné de Extranjería', maxLength: 9, pattern: /^[a-zA-Z0-9]{1,9}$/, placeholder: 'ABC123456' },
  { value: 'PASAPORTE', label: 'Pasaporte', maxLength: 12, pattern: /^[a-zA-Z0-9]{1,12}$/, placeholder: 'AB1234567' },
];

interface Usuario {
  id: number;
  tipo_documento: string;
  documento: string;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  rol: string;
  activo: boolean;
  primer_inicio: boolean;
  created_at: string;
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ tipo_documento: 'DNI', documento: '', rol: 'ALMACENERO' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editForm, setEditForm] = useState({ rol: 'ALMACENERO', activo: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch {
      showError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsuarios();
  }, [isAdmin, fetchUsuarios]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tiene permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  const docType = DOCUMENT_TYPES.find(d => d.value === createForm.tipo_documento)!;

  const handleDocumentoChange = (value: string) => {
    if (createForm.tipo_documento === 'DNI') {
      setCreateForm({ ...createForm, documento: value.replace(/\D/g, '').slice(0, 8) });
    } else {
      setCreateForm({ ...createForm, documento: value.replace(/[^a-zA-Z0-9]/g, '').slice(0, docType.maxLength) });
    }
  };

  const openNew = () => {
    setCreateForm({ tipo_documento: 'DNI', documento: '', rol: 'ALMACENERO' });
    setCreateError('');
    setCreateModal(true);
  };

  const openEdit = (usuario: Usuario) => {
    setEditing(usuario);
    setEditForm({ rol: usuario.rol, activo: usuario.activo });
    setEditError('');
    setEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docType.pattern.test(createForm.documento)) {
      setCreateError(`El ${docType.label} ingresado no es válido`);
      return;
    }
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/usuarios', {
        tipo_documento: createForm.tipo_documento,
        documento: createForm.documento,
        rol: createForm.rol,
      });
      setCreateModal(false);
      showSuccess('Usuario creado exitosamente');
      fetchUsuarios();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(error.response?.data?.message || 'Error al crear usuario');
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
      await api.put(`/usuarios/${editing.id}`, editForm);
      setEditModal(false);
      showSuccess('Usuario actualizado');
      fetchUsuarios();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async (usuario: Usuario) => {
    const confirmed = await confirmAction(
      'Resetear Contraseña',
      `Se reseteará la contraseña de ${usuario.nombre || usuario.documento} al número de documento.`
    );
    if (!confirmed) return;
    try {
      await api.put(`/usuarios/${usuario.id}/reset-password`);
      showSuccess('Contraseña reseteada exitosamente');
    } catch {
      showError('Error al resetear contraseña');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('este usuario');
    if (!confirmed) return;
    try {
      await api.delete(`/usuarios/${id}`);
      showSuccess('Usuario eliminado');
      fetchUsuarios();
    } catch {
      showError('Error al eliminar usuario');
    }
  };

  const rolBadge = (rol: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      ALMACENERO: 'bg-blue-100 text-blue-700',
      SUPERVISOR: 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[rol] || 'bg-gray-100 text-gray-700'}`}>
        {rol}
      </span>
    );
  };

  const docTypeLabel = (tipo: string) => {
    const dt = DOCUMENT_TYPES.find(d => d.value === tipo);
    return dt ? dt.label : tipo;
  };

  const columns = [
    { header: 'Tipo Doc', key: 'tipo_documento', className: 'w-32',
      render: (item: Usuario) => docTypeLabel(item.tipo_documento),
    },
    { header: 'Documento', key: 'documento', className: 'w-28' },
    {
      header: 'Nombre Completo', key: 'nombre',
      render: (item: Usuario) => item.nombre
        ? `${item.nombre} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`.trim()
        : <span className="text-gray-400 italic">Pendiente</span>,
    },
    {
      header: 'Rol', key: 'rol', className: 'w-32',
      render: (item: Usuario) => rolBadge(item.rol),
    },
    {
      header: 'Estado', key: 'activo', className: 'w-28',
      render: (item: Usuario) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Primer Inicio', key: 'primer_inicio', className: 'w-28',
      render: (item: Usuario) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.primer_inicio ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
          {item.primer_inicio ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      header: 'Fecha Registro', key: 'created_at', className: 'w-32',
      render: (item: Usuario) => new Date(item.created_at).toLocaleDateString('es-PE'),
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-32',
      render: (item: Usuario) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleResetPassword(item)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Resetear Contraseña">
            <RotateCcw className="w-4 h-4" />
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
            {usuarios.length} usuarios registrados
            <span className="mx-1.5 text-gray-300">|</span>
            <span className="text-emerald-600 font-medium">{usuarios.filter(u => u.activo).length} activos</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-red-500 font-medium">{usuarios.filter(u => !u.activo).length} inactivos</span>
          </p>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={usuarios} loading={loading} emptyMessage="No hay usuarios registrados" />

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{createError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select
              value={createForm.tipo_documento}
              onChange={(e) => setCreateForm({ ...createForm, tipo_documento: e.target.value, documento: '' })}
              className="input-field"
            >
              {DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de Documento</label>
            <input
              type="text"
              value={createForm.documento}
              onChange={(e) => handleDocumentoChange(e.target.value)}
              className="input-field"
              required
              maxLength={docType.maxLength}
              placeholder={docType.placeholder}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={createForm.rol}
              onChange={(e) => setCreateForm({ ...createForm, rol: e.target.value })}
              className="input-field"
            >
              <option value="ADMIN">Administrador</option>
              <option value="ALMACENERO">Almacenero</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            La contraseña inicial será el número de documento. El usuario deberá cambiarla en su primer inicio de sesión.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
              {createLoading ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Usuario">
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{editError}</div>
          )}
          {editing && (
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-sm text-gray-600">
              <p><strong>Documento:</strong> {editing.tipo_documento} - {editing.documento}</p>
              <p><strong>Nombre:</strong> {editing.nombre ? `${editing.nombre} ${editing.apellido_paterno || ''} ${editing.apellido_materno || ''}`.trim() : 'Pendiente'}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={editForm.rol}
              onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
              className="input-field"
            >
              <option value="ADMIN">Administrador</option>
              <option value="ALMACENERO">Almacenero</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={editForm.activo}
              onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">Usuario activo</label>
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
