'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, Pencil, Trash2, Package, RotateCcw, History, ArrowDownToLine, Boxes } from 'lucide-react';
import Swal from 'sweetalert2';
import { showSuccess, showError, confirmDelete } from '@/lib/swal';
import Select from 'react-select';

interface UnidadMedida { id: number; nombre: string; }
interface Categoria { id: number; nombre: string; }
interface Persona { id: number; nombre: string; tipo?: string; }

interface Equipo {
  id: number;
  codigo?: string;
  nombre: string;
  categoria: { id: number; nombre: string } | null;
  unidadMedida: { id: number; nombre: string } | null;
  estado?: string;
  stock_disponible?: number;
}

interface SalidaAbierta {
  id: number;
  fecha: string;
  tipo_salida: string;
  cantidad: number;
  frente_trabajo: string;
  cantidad_pendiente: number;
}

interface EntradaEquipo {
  id: number;
  fecha: string;
  tipo_entrada: string;
  cantidad: number;
  descripcion_trabajo: string;
  equipo: { id: number; nombre: string };
  quienEntrega: { id: number; nombre: string } | null;
  quienRecibe: { id: number; nombre: string } | null;
  salidaOrigen: { id: number; tipo_salida: string; frenteTrabajo: { nombre: string } | null } | null;
}

interface EquiposTabProps {
  personas: Persona[];
}

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

const emptyEntradaForm = {
  tipo_entrada: 'ADQUISICION',
  salida_equipo_id: '',
  cantidad: '1',
  observaciones: '',
  quien_entrega_id: '',
  quien_recibe_id: '',
};

export default function EquiposTab({ personas }: EquiposTabProps) {
  const { user } = useAuth();

  // Equipos list state
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  // Equipo form modal
  const [equipoModal, setEquipoModal] = useState(false);
  const [editing, setEditing] = useState<Equipo | null>(null);
  const [equipoForm, setEquipoForm] = useState({ nombre: '', categoria_id: '', unidad_medida_id: '', cantidad_inicial: '1' });
  const [estadoEdit, setEstadoEdit] = useState('EN_ALMACEN');
  const [codigoPreview, setCodigoPreview] = useState('');
  const [equipoFormLoading, setEquipoFormLoading] = useState(false);
  const [equipoFormError, setEquipoFormError] = useState('');

  // Entrada modal
  const [entradaModal, setEntradaModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [entradaForm, setEntradaForm] = useState(emptyEntradaForm);
  const [salidasAbiertas, setSalidasAbiertas] = useState<SalidaAbierta[]>([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [entradaFormLoading, setEntradaFormLoading] = useState(false);
  const [entradaFormError, setEntradaFormError] = useState('');

  // Historial modal
  const [historialModal, setHistorialModal] = useState(false);
  const [historialEquipo, setHistorialEquipo] = useState<Equipo | null>(null);
  const [historialData, setHistorialData] = useState<EntradaEquipo[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [historialTipoFilter, setHistorialTipoFilter] = useState('');

  // Catalog data
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);

  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'ALMACENERO';
  const canDelete = user?.rol === 'ADMIN';

  const proveedores = personas.filter(p => p.tipo === 'PROVEEDOR');
  const trabajadores = personas.filter(p => p.tipo !== 'PROVEEDOR');

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data)).catch(console.error);
    api.get('/unidades-medida/activos').then(res => setUnidadesMedida(res.data)).catch(console.error);
  }, []);

  // Codigo preview
  useEffect(() => {
    if (!equipoForm.nombre) { setCodigoPreview(''); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/equipos/preview-codigo', {
          params: { nombre: equipoForm.nombre, ...(equipoForm.categoria_id && { categoria_id: equipoForm.categoria_id }) },
        });
        setCodigoPreview(res.data.preview);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [equipoForm.nombre, equipoForm.categoria_id]);

  // Salidas abiertas when RETORNO
  useEffect(() => {
    if (entradaForm.tipo_entrada === 'RETORNO' && selectedEquipo) {
      setLoadingSalidas(true);
      setSalidasAbiertas([]);
      api.get(`/salida-equipos/abiertas/${selectedEquipo.id}`)
        .then(res => setSalidasAbiertas(res.data))
        .catch(console.error)
        .finally(() => setLoadingSalidas(false));
    } else {
      setSalidasAbiertas([]);
    }
  }, [entradaForm.tipo_entrada, selectedEquipo]);

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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchEquipos, 300);
    return () => clearTimeout(timer);
  }, [fetchEquipos]);

  useEffect(() => {
    if (!historialModal || !historialEquipo) return;
    const controller = new AbortController();
    setHistorialLoading(true);
    const params: Record<string, string | number> = { page: historialPage, limit: 10 };
    if (historialTipoFilter) params.tipo_entrada = historialTipoFilter;
    api.get(`/entrada-equipos/equipo/${historialEquipo.id}`, { params, signal: controller.signal })
      .then(res => {
        setHistorialData(res.data.data);
        setHistorialTotalPages(res.data.totalPages);
        setHistorialTotal(res.data.total);
      })
      .catch(err => { if (err.name !== 'CanceledError') console.error(err); })
      .finally(() => setHistorialLoading(false));
    return () => controller.abort();
  }, [historialModal, historialEquipo, historialPage, historialTipoFilter]);

  // Equipo modal handlers
  const openNew = () => {
    setEditing(null);
    setEquipoForm({ nombre: '', categoria_id: '', unidad_medida_id: '', cantidad_inicial: '1' });
    setCodigoPreview('');
    setEquipoFormError('');
    setEquipoModal(true);
  };

  const openEdit = (equipo: Equipo) => {
    setEditing(equipo);
    setEquipoForm({ nombre: equipo.nombre, categoria_id: equipo.categoria?.id?.toString() || '', unidad_medida_id: equipo.unidadMedida?.id?.toString() || '', cantidad_inicial: '1' });
    setEstadoEdit(equipo.estado || 'EN_ALMACEN');
    setEquipoFormError('');
    setEquipoModal(true);
  };

  const handleEquipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEquipoFormError('');
    if (!equipoForm.nombre.trim()) {
      setEquipoFormError('El nombre del equipo es requerido');
      return;
    }
    if (!editing) {
      const cantInicial = parseInt(equipoForm.cantidad_inicial);
      if (!cantInicial || cantInicial < 1) {
        setEquipoFormError('La cantidad inicial debe ser al menos 1');
        return;
      }
    }
    setEquipoFormLoading(true);
    try {
      const payload: Record<string, string | number> = { nombre: equipoForm.nombre };
      if (equipoForm.categoria_id) payload.categoria_id = parseInt(equipoForm.categoria_id);
      if (equipoForm.unidad_medida_id) payload.unidad_medida_id = parseInt(equipoForm.unidad_medida_id);
      if (editing) {
        await api.put(`/equipos/${editing.id}`, payload);
      } else {
        payload.cantidad_inicial = parseInt(equipoForm.cantidad_inicial) || 1;
        await api.post('/equipos', payload);
      }
      setEquipoModal(false);
      showSuccess(editing ? 'Equipo actualizado' : 'Equipo creado exitosamente');
      fetchEquipos();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string; existing?: { id: number; codigo: string; nombre: string } } } };
      if (error.response?.status === 409 && error.response.data?.existing) {
        const ex = error.response.data.existing;
        setEquipoModal(false);
        const result = await Swal.fire({
          title: 'Equipo ya registrado',
          html: `Ya existe <strong>${ex.nombre}</strong> (${ex.codigo}).<br/>¿Deseas agregar <strong>${equipoForm.cantidad_inicial} unidades</strong> a su stock existente?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, agregar stock',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#6366f1',
          cancelButtonColor: '#6b7280',
        });
        if (result.isConfirmed) {
          try {
            await api.post('/entrada-equipos', {
              tipo_entrada: 'ADQUISICION',
              equipo_id: ex.id,
              cantidad: parseInt(equipoForm.cantidad_inicial) || 1,
            });
            showSuccess(`Se agregaron ${equipoForm.cantidad_inicial} unidades al stock de ${ex.nombre}`);
            fetchEquipos();
          } catch { showError('Error al agregar stock'); }
        }
        return;
      }
      setEquipoFormError(error.response?.data?.message || 'Error al guardar');
    } finally { setEquipoFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete('este equipo');
    if (!confirmed) return;
    try {
      await api.delete(`/equipos/${id}`);
      showSuccess('Equipo eliminado');
      fetchEquipos();
    } catch { showError('Error al eliminar equipo'); }
  };

  // Entrada modal handlers
  const openEntrada = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setEntradaForm(emptyEntradaForm);
    setSalidasAbiertas([]);
    setEntradaFormError('');
    setEntradaModal(true);
  };

  const handleTipoEntradaChange = (tipo: string) => {
    setEntradaForm(f => ({ ...f, tipo_entrada: tipo, salida_equipo_id: '', quien_entrega_id: '' }));
  };

  const handleEntradaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntradaFormError('');
    const cantidadNum = parseInt(entradaForm.cantidad);
    if (!cantidadNum || cantidadNum < 1) {
      setEntradaFormError('La cantidad debe ser al menos 1');
      return;
    }
    if (entradaForm.tipo_entrada === 'RETORNO' && !entradaForm.salida_equipo_id) {
      setEntradaFormError('Debe seleccionar la salida de origen para registrar una devolución');
      return;
    }
    if (entradaForm.tipo_entrada === 'RETORNO' && selectedSalidaAbierta && cantidadNum > selectedSalidaAbierta.cantidad_pendiente) {
      setEntradaFormError(`La cantidad (${cantidadNum}) supera el pendiente de esa salida (${selectedSalidaAbierta.cantidad_pendiente})`);
      return;
    }
    setEntradaFormLoading(true);
    try {
      const payload: Record<string, string | number> = {
        tipo_entrada: entradaForm.tipo_entrada,
        equipo_id: selectedEquipo!.id,
        cantidad: parseInt(entradaForm.cantidad),
      };
      if (entradaForm.observaciones) payload.descripcion_trabajo = entradaForm.observaciones;
      if (entradaForm.quien_entrega_id) payload.quien_entrega_id = parseInt(entradaForm.quien_entrega_id);
      if (entradaForm.quien_recibe_id) payload.quien_recibe_id = parseInt(entradaForm.quien_recibe_id);
      if (entradaForm.tipo_entrada === 'RETORNO' && entradaForm.salida_equipo_id) {
        payload.salida_equipo_id = parseInt(entradaForm.salida_equipo_id);
      }
      await api.post('/entrada-equipos', payload);
      setEntradaModal(false);
      showSuccess('Entrada registrada exitosamente');
      fetchEquipos();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      setEntradaFormError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar');
    } finally { setEntradaFormLoading(false); }
  };

  // Historial handlers
  const openHistorial = (equipo: Equipo) => {
    setHistorialEquipo(equipo);
    setHistorialPage(1);
    setHistorialTipoFilter('');
    setHistorialData([]);
    setHistorialModal(true);
  };

  const selectedSalidaAbierta = salidasAbiertas.find(s => String(s.id) === entradaForm.salida_equipo_id);
  const tipoLabel = (tipo: string) => tipo === 'ADQUISICION' ? 'Compra/Ingreso' : 'Devolución';

  const columns = [
    { header: 'Código', key: 'codigo', className: 'whitespace-nowrap' },
    { header: 'Nombre', key: 'nombre' },
    { header: 'Categoría', key: 'categoria', className: 'whitespace-nowrap', render: (item: Equipo) => item.categoria?.nombre || '-' },
    { header: 'Unidad', key: 'unidadMedida', className: 'whitespace-nowrap', render: (item: Equipo) => item.unidadMedida?.nombre || '-' },
    {
      header: 'Stock', key: 'stock_disponible', className: 'whitespace-nowrap text-center',
      render: (item: Equipo) => {
        const stock = item.stock_disponible ?? 0;
        return (
          <span className={`inline-flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded-full ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            <Boxes className="w-3.5 h-3.5" />
            {stock}
          </span>
        );
      },
    },
    {
      header: 'Acciones', key: 'actions', className: 'whitespace-nowrap text-center',
      render: (item: Equipo) => (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {canEdit && (
            <button
              onClick={() => openEntrada(item)}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5"
              title="Registrar entrada"
            >
              <ArrowDownToLine className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium">+ Entrada</span>
            </button>
          )}
          <button
            onClick={() => openHistorial(item)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            title="Ver historial"
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Historial</span>
          </button>
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

  const historialColumns = [
    {
      header: 'Fecha', key: 'fecha', className: 'whitespace-nowrap',
      render: (item: EntradaEquipo) => new Date(item.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { header: 'Tipo', key: 'tipo_entrada', className: 'whitespace-nowrap', render: (item: EntradaEquipo) => <StatusBadge status={item.tipo_entrada} /> },
    { header: 'Cant.', key: 'cantidad', className: 'whitespace-nowrap text-center' },
    {
      header: 'Salida origen', key: 'salidaOrigen', className: 'whitespace-nowrap', hideOnMobile: true,
      render: (item: EntradaEquipo) => item.salidaOrigen
        ? `#${item.salidaOrigen.id} — ${item.salidaOrigen.frenteTrabajo?.nombre || item.salidaOrigen.tipo_salida}`
        : '—',
    },
    { header: 'Observaciones', key: 'descripcion_trabajo', hideOnMobile: true },
    { header: 'Entregado por', key: 'quienEntrega', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: EntradaEquipo) => item.quienEntrega?.nombre || '—' },
    { header: 'Recibido por', key: 'quienRecibe', className: 'whitespace-nowrap', hideOnMobile: true, render: (item: EntradaEquipo) => item.quienRecibe?.nombre || '—' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
            <option value="">Todos</option>
            <option value="EN_ALMACEN">Con stock</option>
            <option value="AGOTADO">Sin stock</option>
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

      {/* ── Modal: Nuevo / Editar Equipo ── */}
      <Modal isOpen={equipoModal} onClose={() => setEquipoModal(false)} title={editing ? 'Editar Equipo' : 'Nuevo Equipo'}>
        <form onSubmit={handleEquipoSubmit} className="space-y-4" noValidate>
          {equipoFormError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{equipoFormError}</div>
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
              <Select
                options={categorias.map(c => ({ value: String(c.id), label: c.nombre }))}
                value={equipoForm.categoria_id ? { value: equipoForm.categoria_id, label: categorias.find(c => String(c.id) === equipoForm.categoria_id)?.nombre || '' } : null}
                onChange={(opt) => setEquipoForm({ ...equipoForm, categoria_id: opt?.value || '' })}
                placeholder="Buscar categoría..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
              <Select
                options={unidadesMedida.map(u => ({ value: String(u.id), label: u.nombre }))}
                value={equipoForm.unidad_medida_id ? { value: equipoForm.unidad_medida_id, label: unidadesMedida.find(u => String(u.id) === equipoForm.unidad_medida_id)?.nombre || '' } : null}
                onChange={(opt) => setEquipoForm({ ...equipoForm, unidad_medida_id: opt?.value || '' })}
                placeholder="Buscar unidad..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
            </div>
          </div>
          <div className={editing ? '' : 'grid grid-cols-2 gap-4'}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={equipoForm.nombre}
                onChange={(e) => setEquipoForm({ ...equipoForm, nombre: e.target.value.toUpperCase() })}
                className="input-field"
                required
                placeholder="ej: MONITOR DELL 24 PULGADAS"
              />
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={equipoForm.cantidad_inicial}
                  onChange={(e) => setEquipoForm({ ...equipoForm, cantidad_inicial: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input type="text" value={estadoEdit} readOnly className="input-field bg-gray-50 text-gray-600 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">El estado se modifica mediante movimientos de equipos</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEquipoModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={equipoFormLoading || (!editing && !codigoPreview)} className="btn-primary disabled:opacity-50">
              {equipoFormLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Registrar Entrada ── */}
      <Modal isOpen={entradaModal} onClose={() => setEntradaModal(false)} title="Registrar Entrada de Equipo" maxWidth="max-w-2xl">
        <form onSubmit={handleEntradaSubmit} className="space-y-5" noValidate>
          {entradaFormError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">{entradaFormError}</div>
          )}

          {/* Equipo info banner */}
          {selectedEquipo && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <Package className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-800">{selectedEquipo.nombre}</p>
                {selectedEquipo.codigo && <p className="text-xs text-indigo-500">{selectedEquipo.codigo}</p>}
              </div>
              <StatusBadge status={selectedEquipo.estado || 'EN_ALMACEN'} />
            </div>
          )}

          {/* Tipo selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo ingresa el equipo? <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoEntradaChange('ADQUISICION')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${entradaForm.tipo_entrada === 'ADQUISICION' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <Package className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Compra / Ingreso</p>
                  <p className="text-xs opacity-70 mt-0.5">Equipo nuevo al almacén</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTipoEntradaChange('RETORNO')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${entradaForm.tipo_entrada === 'RETORNO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <RotateCcw className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Devolución desde Campo</p>
                  <p className="text-xs opacity-70 mt-0.5">Regresa de un frente de trabajo</p>
                </div>
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="max-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={entradaForm.cantidad}
              onChange={(e) => setEntradaForm({ ...entradaForm, cantidad: e.target.value })}
              className="input-field"
            />
            {selectedSalidaAbierta && (
              <p className="text-xs text-amber-600 mt-1">Máximo: {selectedSalidaAbierta.cantidad_pendiente} unidad(es)</p>
            )}
          </div>

          {/* Salida origen — solo RETORNO */}
          {entradaForm.tipo_entrada === 'RETORNO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿De qué salida retorna? <span className="text-red-500">*</span></label>
              {loadingSalidas ? (
                <p className="text-sm text-gray-400 italic">Buscando salidas abiertas...</p>
              ) : salidasAbiertas.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                  Este equipo no tiene salidas pendientes de devolución
                </div>
              ) : (
                <Select
                  options={salidasAbiertas.map(s => ({
                    value: String(s.id),
                    label: `${s.frente_trabajo} — ${s.tipo_salida === 'PRESTAMO' ? 'Préstamo' : 'Asignación'} — Pendiente: ${s.cantidad_pendiente} und.`,
                  }))}
                  value={entradaForm.salida_equipo_id
                    ? {
                        value: entradaForm.salida_equipo_id,
                        label: (() => {
                          const s = salidasAbiertas.find(x => String(x.id) === entradaForm.salida_equipo_id);
                          return s ? `${s.frente_trabajo} — ${s.tipo_salida === 'PRESTAMO' ? 'Préstamo' : 'Asignación'} — Pendiente: ${s.cantidad_pendiente} und.` : '';
                        })(),
                      }
                    : null}
                  onChange={(opt) => setEntradaForm(f => ({ ...f, salida_equipo_id: opt?.value || '' }))}
                  placeholder="Seleccionar salida a devolver..."
                  noOptionsMessage={() => 'Sin resultados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              )}
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
              <span className="text-gray-400 font-normal ml-1 text-xs">
                {entradaForm.tipo_entrada === 'ADQUISICION' ? '(ej: N° factura, proveedor)' : '(ej: condición del equipo al retornar)'}
              </span>
            </label>
            <input
              type="text"
              value={entradaForm.observaciones}
              onChange={(e) => setEntradaForm({ ...entradaForm, observaciones: e.target.value })}
              className="input-field"
              placeholder="Opcional"
            />
          </div>

          {/* Entregado / Recibido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {entradaForm.tipo_entrada === 'ADQUISICION' ? 'Proveedor / Quien entrega' : 'Quien devuelve'}
              </label>
              {entradaForm.tipo_entrada === 'ADQUISICION' ? (
                <Select
                  key="entrega-prov"
                  options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  value={entradaForm.quien_entrega_id ? { value: entradaForm.quien_entrega_id, label: proveedores.find(p => String(p.id) === entradaForm.quien_entrega_id)?.nombre || '' } : null}
                  onChange={(opt) => setEntradaForm(f => ({ ...f, quien_entrega_id: opt?.value || '' }))}
                  placeholder="Buscar proveedor..."
                  isClearable
                  noOptionsMessage={() => 'Sin proveedores registrados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              ) : (
                <Select
                  key="entrega-trab"
                  options={trabajadores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  value={entradaForm.quien_entrega_id ? { value: entradaForm.quien_entrega_id, label: trabajadores.find(p => String(p.id) === entradaForm.quien_entrega_id)?.nombre || '' } : null}
                  onChange={(opt) => setEntradaForm(f => ({ ...f, quien_entrega_id: opt?.value || '' }))}
                  placeholder="Buscar trabajador..."
                  isClearable
                  noOptionsMessage={() => 'Sin resultados'}
                  classNamePrefix="rs"
                  styles={selectStyles}
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                {entradaForm.tipo_entrada === 'ADQUISICION' ? 'Solo muestra proveedores' : 'Solo muestra trabajadores'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recibido por (almacén)</label>
              <Select
                options={trabajadores.map(p => ({ value: String(p.id), label: p.nombre }))}
                value={entradaForm.quien_recibe_id ? { value: entradaForm.quien_recibe_id, label: trabajadores.find(p => String(p.id) === entradaForm.quien_recibe_id)?.nombre || '' } : null}
                onChange={(opt) => setEntradaForm({ ...entradaForm, quien_recibe_id: opt?.value || '' })}
                placeholder="Buscar trabajador..."
                isClearable
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rs"
                styles={selectStyles}
              />
              <p className="text-xs text-gray-400 mt-1">Solo muestra trabajadores</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setEntradaModal(false)} className="btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={entradaFormLoading || (entradaForm.tipo_entrada === 'RETORNO' && (!entradaForm.salida_equipo_id || salidasAbiertas.length === 0))}
              className="btn-primary disabled:opacity-50"
            >
              {entradaFormLoading ? 'Guardando...' : `Registrar ${tipoLabel(entradaForm.tipo_entrada)}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Historial ── */}
      <Modal isOpen={historialModal} onClose={() => setHistorialModal(false)} title="Historial de Entradas" maxWidth="max-w-4xl">
        <div className="space-y-4">
          {/* Equipo banner — identifica sin ambigüedad a qué equipo pertenece el historial */}
          {historialEquipo && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <History className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{historialEquipo.nombre}</p>
                {historialEquipo.codigo && (
                  <p className="text-xs text-slate-400 font-mono">{historialEquipo.codigo}</p>
                )}
              </div>
              <span className="text-sm text-slate-500 whitespace-nowrap">{historialTotal} registro(s)</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {(['', 'ADQUISICION', 'RETORNO'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => { setHistorialTipoFilter(tipo); setHistorialPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${historialTipoFilter === tipo ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tipo === '' ? 'Todos' : tipo === 'ADQUISICION' ? 'Compra/Ingreso' : 'Devolución'}
              </button>
            ))}
          </div>
          <DataTable columns={historialColumns} data={historialData} loading={historialLoading} rowNumberOffset={(historialPage - 1) * 10} />
          <Pagination page={historialPage} totalPages={historialTotalPages} total={historialTotal} onPageChange={setHistorialPage} />
        </div>
      </Modal>
    </div>
  );
}
