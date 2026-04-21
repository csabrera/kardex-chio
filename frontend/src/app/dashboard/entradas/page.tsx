'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { Search, Plus, Trash2, ArrowDownToLine } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';

interface Recurso {
  id: number;
  nombre: string;
  unidad: string;
  categoria: string;
  existencia_actual: number;
}

interface Persona {
  id: number;
  nombre: string;
  tipo: string;
}

interface MedioTransporte {
  id: number;
  nombre: string;
}

interface Entrada {
  id: number;
  fecha: string;
  num_guia: string | null;
  recurso_id: number;
  cantidad: number;
  quien_entrega_id: number | null;
  quien_recibe_id: number | null;
  medio_transporte_id: number | null;
  quienEntrega: { id: number; nombre: string } | null;
  quienRecibe: { id: number; nombre: string } | null;
  medioTransporte: { id: number; nombre: string } | null;
  recurso: {
    id: number;
    nombre: string;
    unidad: string;
    categoria: string;
    existencia_actual: number;
  };
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function EntradasPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Dropdown data
  const [proveedores, setProveedores] = useState<Persona[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [mediosTransporte, setMediosTransporte] = useState<MedioTransporte[]>([]);

  // Modal state
  const [nuevoModal, setNuevoModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    num_guia: '',
    recurso_id: '',
    cantidad: '',
    quien_entrega_id: '',
    quien_recibe_id: '',
    medio_transporte_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Resource search state
  const [recursoSearch, setRecursoSearch] = useState('');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoDropdown, setRecursoDropdown] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null);
  const recursoRef = useRef<HTMLDivElement>(null);

  const canCreate = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(console.error);
    api.get('/personas/activos', { params: { tipo: 'PROVEEDOR' } }).then((res) => setProveedores(res.data)).catch(console.error);
    api.get('/personas/activos').then((res) => setPersonas(res.data)).catch(console.error);
    api.get('/medios-transporte/activos').then((res) => setMediosTransporte(res.data)).catch(console.error);
  }, []);

  // Close resource dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recursoRef.current && !recursoRef.current.contains(e.target as Node)) {
        setRecursoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search resources for the form dropdown
  useEffect(() => {
    if (!recursoSearch || recursoSearch.length < 2) {
      setRecursos([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/recursos', { params: { search: recursoSearch, limit: 10 } });
        setRecursos(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [recursoSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoriaId) params.categoria_id = categoriaId;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await api.get('/entradas', { params });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoriaId, fechaDesde, fechaHasta]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recurso_id) {
      setFormError('Debe seleccionar un recurso');
      return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/entradas', {
        fecha: form.fecha,
        num_guia: form.num_guia || undefined,
        recurso_id: parseInt(form.recurso_id),
        cantidad: parseInt(form.cantidad),
        quien_entrega_id: form.quien_entrega_id ? parseInt(form.quien_entrega_id) : undefined,
        quien_recibe_id: form.quien_recibe_id ? parseInt(form.quien_recibe_id) : undefined,
        medio_transporte_id: form.medio_transporte_id ? parseInt(form.medio_transporte_id) : undefined,
      });
      setNuevoModal(false);
      resetForm();
      showSuccess('Entrada registrada exitosamente');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al registrar entrada');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta entrada');
    if (!confirmed) return;
    try {
      await api.delete(`/entradas/${id}`);
      showSuccess('Entrada eliminada');
      fetchData();
    } catch {
      showError('Error al eliminar entrada');
    }
  };

  const resetForm = () => {
    setForm({
      fecha: new Date().toISOString().slice(0, 16),
      num_guia: '',
      recurso_id: '',
      cantidad: '',
      quien_entrega_id: '',
      quien_recibe_id: '',
      medio_transporte_id: '',
    });
    setRecursoSearch('');
    setSelectedRecurso(null);
    setFormError('');
  };

  const selectRecurso = (recurso: Recurso) => {
    setSelectedRecurso(recurso);
    setForm({ ...form, recurso_id: String(recurso.id) });
    setRecursoSearch(`${recurso.nombre} (${recurso.unidad}) - Stock: ${recurso.existencia_actual}`);
    setRecursoDropdown(false);
  };

  const columns = [
    {
      header: 'Fecha', key: 'fecha',
      render: (item: Entrada) => new Date(item.fecha).toLocaleDateString('es-PE'),
    },
    { header: 'N° Guía', key: 'num_guia',
      render: (item: Entrada) => item.num_guia || '-',
    },
    {
      header: 'Recurso', key: 'recurso_nombre', maxWidth: 250,
      render: (item: Entrada) => (
        <div>
          <div className="font-medium text-gray-900">{item.recurso.nombre}</div>
          <div className="text-xs text-gray-500">[{item.recurso.categoria}]</div>
        </div>
      ),
    },
    {
      header: 'Unidad', key: 'unidad',
      render: (item: Entrada) => item.recurso.unidad,
    },
    {
      header: 'Cantidad', key: 'cantidad', className: 'text-center',
      render: (item: Entrada) => (
        <span className="text-emerald-600 font-semibold">+{item.cantidad}</span>
      ),
    },
    {
      header: 'Entrega', key: 'quien_entrega', hideOnMobile: true,
      render: (item: Entrada) => item.quienEntrega?.nombre || '-',
    },
    {
      header: 'Recibe', key: 'quien_recibe', hideOnMobile: true,
      render: (item: Entrada) => item.quienRecibe?.nombre || '-',
    },
    {
      header: 'Transporte', key: 'medio_transporte', hideOnMobile: true,
      render: (item: Entrada) => item.medioTransporte?.nombre || '-',
    },
    ...(canDelete ? [{
      header: 'Acciones', key: 'actions', className: 'w-16 flex-shrink-0 text-center',
      render: (item: Entrada) => (
        <button
          onClick={() => handleDelete(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-2">
        <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
          <ArrowDownToLine className="w-4 md:w-5 h-4 md:h-5 text-emerald-600" />
        </div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900">Entradas</h1>
      </div>

      {/* Filters */}
      <div className="card p-3 md:p-6">
        <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
          {/* Search - Full width on mobile */}
          <div className="flex-1 min-w-full md:min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por recurso o código..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 text-sm md:text-base"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:flex md:flex-wrap md:flex-1">
            <select
              value={categoriaId}
              onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}
              className="input-field text-xs md:text-sm md:w-48 py-2 md:py-2.5"
            >
              <option value="">Categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="input-field text-xs md:text-sm py-2 md:py-2.5"
              title="Fecha desde"
            />
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="input-field text-xs md:text-sm py-2 md:py-2.5"
              title="Fecha hasta"
            />
          </div>

          {/* Button */}
          {canCreate && (
            <button onClick={() => { resetForm(); setNuevoModal(true); }} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto text-sm md:text-base py-2 md:py-2.5">
              <Plus className="w-4 h-4" />
              <span>Nueva</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No hay entradas registradas" rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* Nueva Entrada Modal */}
      <Modal isOpen={nuevoModal} onClose={() => setNuevoModal(false)} title="Nueva Entrada">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="datetime-local"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Guía</label>
              <input
                type="text"
                value={form.num_guia}
                onChange={(e) => setForm({ ...form, num_guia: e.target.value })}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Resource selector */}
          <div ref={recursoRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurso</label>
            <input
              type="text"
              value={recursoSearch}
              onChange={(e) => {
                setRecursoSearch(e.target.value);
                setRecursoDropdown(true);
                if (selectedRecurso) {
                  setSelectedRecurso(null);
                  setForm({ ...form, recurso_id: '' });
                }
              }}
              onFocus={() => recursoSearch.length >= 2 && setRecursoDropdown(true)}
              className="input-field"
              placeholder="Escriba para buscar un recurso..."
              required
            />
            {recursoDropdown && recursos.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {recursos.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRecurso(r)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{r.nombre}</span>
                        <span className="text-gray-400 mx-1">[{r.categoria}]</span>
                        <span className="text-gray-500 text-xs">({r.unidad})</span>
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ml-2 ${r.existencia_actual > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        Stock: {r.existencia_actual}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {recursoDropdown && recursoSearch.length >= 2 && recursos.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-400 text-center">
                No se encontraron recursos
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Entrega</label>
              <select
                value={form.quien_entrega_id}
                onChange={(e) => setForm({ ...form, quien_entrega_id: e.target.value })}
                className="input-field"
              >
                <option value="">-- Seleccionar --</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Recibe</label>
              <select
                value={form.quien_recibe_id}
                onChange={(e) => setForm({ ...form, quien_recibe_id: e.target.value })}
                className="input-field"
              >
                <option value="">-- Seleccionar --</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Transporte</label>
            <select
              value={form.medio_transporte_id}
              onChange={(e) => setForm({ ...form, medio_transporte_id: e.target.value })}
              className="input-field"
            >
              <option value="">-- Seleccionar --</option>
              {mediosTransporte.map((mt) => (
                <option key={mt.id} value={mt.id}>{mt.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNuevoModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={formLoading} className="btn-primary disabled:opacity-50">
              {formLoading ? 'Guardando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
