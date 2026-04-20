'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { Search, Plus, Trash2, Pencil, ArrowUpFromLine } from 'lucide-react';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';
import Select from 'react-select';

interface Recurso {
  id: number;
  codigo: string;
  nombre: string;
  unidad: string;
  categoria: { nombre: string };
}

interface Persona {
  id: number;
  nombre: string;
}

interface FrenteTrabajo {
  id: number;
  nombre: string;
}

interface Salida {
  id: number;
  fecha: string;
  num_registro: string | null;
  recurso_id: number;
  cantidad: number;
  quien_entrega_id: number | null;
  quien_recibe_id: number | null;
  frente_trabajo_id: number | null;
  descripcion_trabajo: string | null;
  quienEntrega: { id: number; nombre: string } | null;
  quienRecibe: { id: number; nombre: string } | null;
  frenteTrabajo: { id: number; nombre: string } | null;
  recurso: {
    id: number;
    codigo: string;
    nombre: string;
    unidad: string;
    categoria: { nombre: string };
  };
}

interface Categoria {
  id: number;
  nombre: string;
}

interface SalidasTabProps { categorias: Categoria[] }

const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: '38px',
    borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    '&:hover': { borderColor: '#6366f1' },
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  singleValue: (base: Record<string, unknown>) => ({ ...base, fontSize: '0.875rem', color: '#111827' }),
  menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999, borderRadius: '0.5rem', fontSize: '0.875rem' }),
};

export default function SalidasTab({ categorias }: SalidasTabProps) {
  const { user } = useAuth();
  const [data, setData] = useState<Salida[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Dropdown data
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [frentesTrabajo, setFrentesTrabajo] = useState<FrenteTrabajo[]>([]);

  // Modal state
  const [nuevoModal, setNuevoModal] = useState(false);
  const [editing, setEditing] = useState<Salida | null>(null);

  // Form state
  const [form, setForm] = useState({
    fecha: '',
    recurso_id: '',
    cantidad: '',
    frente_trabajo_id: '',
    descripcion_trabajo: '',
    quien_entrega_id: '',
    quien_recibe_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Resource search state
  const [recursoSearch, setRecursoSearch] = useState('');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoDropdown, setRecursoDropdown] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null);
  const recursoRef = useRef<HTMLDivElement>(null);

  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    // Categorias recibidas como prop
    api.get('/personas/activos').then((res) => setPersonas(res.data)).catch(console.error);
    api.get('/frentes-trabajo/activos').then((res) => setFrentesTrabajo(res.data)).catch(console.error);
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
      const res = await api.get('/salidas', { params });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recurso_id) {
      setFormError('Debe seleccionar un recurso');
      return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        fecha: editing ? form.fecha : new Date().toISOString(),
        recurso_id: parseInt(form.recurso_id),
        cantidad: parseInt(form.cantidad),
        frente_trabajo_id: form.frente_trabajo_id ? parseInt(form.frente_trabajo_id) : undefined,
        descripcion_trabajo: form.descripcion_trabajo || undefined,
        quien_entrega_id: form.quien_entrega_id ? parseInt(form.quien_entrega_id) : undefined,
        quien_recibe_id: form.quien_recibe_id ? parseInt(form.quien_recibe_id) : undefined,
      };
      if (editing) {
        await api.put(`/salidas/${editing.id}`, payload);
        showSuccess('Salida actualizada exitosamente');
      } else {
        await api.post('/salidas', payload);
        showSuccess('Salida registrada exitosamente');
      }
      setNuevoModal(false);
      resetForm();
      setEditing(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Error al guardar salida');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (item: Salida) => {
    setEditing(item);
    setForm({
      fecha: item.fecha,
      recurso_id: String(item.recurso.id),
      cantidad: String(item.cantidad),
      frente_trabajo_id: String(item.frenteTrabajo?.id || ''),
      descripcion_trabajo: item.descripcion_trabajo || '',
      quien_entrega_id: String(item.quienEntrega?.id || ''),
      quien_recibe_id: String(item.quienRecibe?.id || ''),
    });
    setRecursoSearch(`${item.recurso.codigo} - ${item.recurso.nombre}`);
    setSelectedRecurso(item.recurso as Recurso);
    setFormError('');
    setNuevoModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('esta salida');
    if (!confirmed) return;
    try {
      await api.delete(`/salidas/${id}`);
      showSuccess('Salida eliminada');
      fetchData();
    } catch {
      showError('Error al eliminar salida');
    }
  };

  const resetForm = () => {
    setForm({
      fecha: '',
      recurso_id: '',
      cantidad: '',
      frente_trabajo_id: '',
      descripcion_trabajo: '',
      quien_entrega_id: '',
      quien_recibe_id: '',
    });
    setRecursoSearch('');
    setSelectedRecurso(null);
    setFormError('');
  };

  const selectRecurso = (recurso: Recurso) => {
    setSelectedRecurso(recurso);
    setForm({ ...form, recurso_id: String(recurso.id) });
    setRecursoSearch(`${recurso.codigo} - ${recurso.nombre}`);
    setRecursoDropdown(false);
  };

  const columns = [
    {
      header: 'Fecha', key: 'fecha', className: 'whitespace-nowrap',
      render: (item: Salida) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      header: 'Código', key: 'codigo', className: 'whitespace-nowrap',
      render: (item: Salida) => item.recurso.codigo,
    },
    {
      header: 'Recurso', key: 'recurso_nombre',
      render: (item: Salida) => item.recurso.nombre,
    },
    {
      header: 'Categoría', key: 'categoria', className: 'whitespace-nowrap',
      render: (item: Salida) => item.recurso.categoria?.nombre || '-',
    },
    {
      header: 'Unidad', key: 'unidad', className: 'whitespace-nowrap',
      render: (item: Salida) => item.recurso.unidad,
    },
    {
      header: 'Cantidad', key: 'cantidad', className: 'whitespace-nowrap text-center',
      render: (item: Salida) => (
        <span className="text-amber-600 font-semibold">-{item.cantidad}</span>
      ),
    },
    {
      header: 'Frente', key: 'frente_trabajo', className: 'whitespace-nowrap',
      render: (item: Salida) => item.frenteTrabajo?.nombre || '-',
    },
    {
      header: 'Descripción', key: 'descripcion_trabajo', className: 'whitespace-nowrap',
      render: (item: Salida) => item.descripcion_trabajo || '-',
    },
    {
      header: 'Entrega', key: 'quien_entrega', className: 'whitespace-nowrap',
      render: (item: Salida) => item.quienEntrega?.nombre || '-',
    },
    {
      header: 'Recibe', key: 'quien_recibe', className: 'whitespace-nowrap',
      render: (item: Salida) => item.quienRecibe?.nombre || '-',
    },
    ...((canEdit || canDelete) ? [{
      header: 'Acciones', key: 'actions', className: 'whitespace-nowrap',
      render: (item: Salida) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => openEdit(item)}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-100 rounded-lg">
          <ArrowUpFromLine className="w-5 h-5 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Salidas de Almacén</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por recurso, código o frente..."
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
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            className="input-field w-40"
            placeholder="Desde"
            title="Fecha desde"
          />
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            className="input-field w-40"
            placeholder="Hasta"
            title="Fecha hasta"
          />
          {canEdit && (
            <button onClick={() => { setEditing(null); resetForm(); setNuevoModal(true); }} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Salida
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No hay salidas registradas" rowNumberOffset={(page - 1) * 20} />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* Nueva Salida Modal */}
      <Modal isOpen={nuevoModal} onClose={() => { setNuevoModal(false); setEditing(null); }} title={editing ? 'Editar Salida' : 'Nueva Salida'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{formError}</div>
          )}
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
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 transition-colors flex justify-between items-center"
                  >
                    <span>
                      <span className="font-medium text-gray-700">{r.codigo}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-600">{r.nombre}</span>
                    </span>
                    <span className="text-xs text-gray-400">{r.unidad}</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Frente de Trabajo</label>
              <Select
                options={frentesTrabajo.map((ft) => ({ value: String(ft.id), label: ft.nombre }))}
                value={form.frente_trabajo_id ? { value: form.frente_trabajo_id, label: frentesTrabajo.find((ft) => String(ft.id) === form.frente_trabajo_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, frente_trabajo_id: opt?.value || '' })}
                placeholder="Buscar frente..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo</label>
              <input
                type="text"
                value={form.descripcion_trabajo}
                onChange={(e) => setForm({ ...form, descripcion_trabajo: e.target.value })}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Entrega</label>
              <Select
                options={personas.map((p) => ({ value: String(p.id), label: p.nombre }))}
                value={form.quien_entrega_id ? { value: form.quien_entrega_id, label: personas.find((p) => String(p.id) === form.quien_entrega_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, quien_entrega_id: opt?.value || '' })}
                placeholder="Buscar persona..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quién Recibe</label>
              <Select
                options={personas.map((p) => ({ value: String(p.id), label: p.nombre }))}
                value={form.quien_recibe_id ? { value: form.quien_recibe_id, label: personas.find((p) => String(p.id) === form.quien_recibe_id)?.nombre || '' } : null}
                onChange={(opt) => setForm({ ...form, quien_recibe_id: opt?.value || '' })}
                placeholder="Buscar persona..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setNuevoModal(false); setEditing(null); }} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={formLoading} className="btn-primary disabled:opacity-50">
              {formLoading ? 'Guardando...' : editing ? 'Actualizar Salida' : 'Registrar Salida'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
