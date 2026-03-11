'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, History, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { showSuccess, showError } from '@/lib/swal';

interface Recurso {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  total_entradas: number;
  total_salidas: number;
  existencia_actual: number;
  status: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface UnidadMedida {
  id: number;
  nombre: string;
  codigo: string;
}

interface Movimiento {
  id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  num_guia?: string;
  num_registro?: string;
  quien_entrega?: string;
  quien_recibe?: string;
  frente_trabajo?: string;
  descripcion_trabajo?: string;
  medio_transporte?: string;
}

export default function InventarioPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [status, setStatus] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  // Modal states
  const [historialModal, setHistorialModal] = useState(false);
  const [historialData, setHistorialData] = useState<{ recurso: Recurso; movimientos: Movimiento[] } | null>(null);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [nuevoModal, setNuevoModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria_id: '',
    unidad_medida_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(console.error);
    api.get('/unidades-medida/activos').then((res) => setUnidades(res.data)).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoriaId) params.categoria_id = categoriaId;
      if (status) params.status = status;
      const res = await api.get('/recursos', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoriaId, status]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openHistorial = async (id: number) => {
    setHistorialModal(true);
    setHistorialLoading(true);
    try {
      const res = await api.get(`/recursos/${id}/historial`);
      setHistorialData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/recursos', {
        codigo: form.codigo,
        nombre: form.nombre,
        categoria_id: parseInt(form.categoria_id),
        unidad_medida_id: parseInt(form.unidad_medida_id),
      });
      setNuevoModal(false);
      setForm({ codigo: '', nombre: '', categoria_id: '', unidad_medida_id: '' });
      showSuccess('Recurso creado exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al crear recurso');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { header: 'Código', key: 'codigo', className: 'w-24' },
    { header: 'Recurso', key: 'nombre' },
    { header: 'Categoría', key: 'categoria', className: 'w-28' },
    { header: 'Unidad', key: 'unidad', className: 'w-20' },
    {
      header: 'Entradas', key: 'total_entradas', className: 'w-24 text-center',
      render: (item: Recurso) => (
        <span className="text-emerald-600 font-medium">{item.total_entradas}</span>
      ),
    },
    {
      header: 'Salidas', key: 'total_salidas', className: 'w-24 text-center',
      render: (item: Recurso) => (
        <span className="text-amber-600 font-medium">{item.total_salidas}</span>
      ),
    },
    {
      header: 'Existencia', key: 'existencia_actual', className: 'w-24 text-center',
      render: (item: Recurso) => (
        <span className="font-bold">{item.existencia_actual}</span>
      ),
    },
    {
      header: 'Status', key: 'status', className: 'w-32',
      render: (item: Recurso) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Acciones', key: 'actions', className: 'w-20',
      render: (item: Recurso) => (
        <button
          onClick={() => openHistorial(item.id)}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Ver historial"
        >
          <History className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoriaId}
            onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}
            className="input-field w-48"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            <option value="">Todos los status</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="AGOTADO">Agotado</option>
          </select>
          {canEdit && (
            <button onClick={() => setNuevoModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Recurso
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={data} loading={loading} rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* Historial Modal */}
      <Modal
        isOpen={historialModal}
        onClose={() => setHistorialModal(false)}
        title={`Historial: ${historialData?.recurso?.nombre || ''}`}
        maxWidth="max-w-2xl"
      >
        {historialLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historialData ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-500">Entradas</p>
                <p className="text-xl font-bold text-emerald-600">{historialData.recurso.total_entradas}</p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-500">Salidas</p>
                <p className="text-xl font-bold text-amber-600">{historialData.recurso.total_salidas}</p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-500">Existencia</p>
                <p className="text-xl font-bold text-gray-800">{historialData.recurso.existencia_actual}</p>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historialData.movimientos.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Sin movimientos registrados</p>
              ) : (
                historialData.movimientos.map((mov, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`p-2 rounded-lg ${mov.tipo === 'ENTRADA' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {mov.tipo === 'ENTRADA' ? (
                        <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {mov.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} — {mov.num_guia || mov.num_registro || 'S/N'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mov.quien_entrega && `Entrega: ${mov.quien_entrega}`}
                        {mov.frente_trabajo && ` · Frente: ${mov.frente_trabajo}`}
                        {mov.descripcion_trabajo && ` · ${mov.descripcion_trabajo}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${mov.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Nuevo Recurso Modal */}
      <Modal isOpen={nuevoModal} onClose={() => setNuevoModal(false)} title="Nuevo Recurso">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Recurso</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} className="input-field" required>
                <option value="">Seleccionar...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
              <select value={form.unidad_medida_id} onChange={(e) => setForm({ ...form, unidad_medida_id: e.target.value })} className="input-field" required>
                <option value="">Seleccionar...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.codigo})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNuevoModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={formLoading} className="btn-primary disabled:opacity-50">
              {formLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
