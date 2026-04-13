'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Package, ArrowDownToLine, ArrowUpFromLine, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/swal';

export default function ReportesPage() {
  const [entradasDesde, setEntradasDesde] = useState('');
  const [entradasHasta, setEntradasHasta] = useState('');
  const [salidasDesde, setSalidasDesde] = useState('');
  const [salidasHasta, setSalidasHasta] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (url: string, filename: string, key: string) => {
    setDownloading(key);
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      showSuccess('Reporte descargado');
    } catch (err) {
      console.error(err);
      showError('Error al descargar el reporte');
    } finally {
      setDownloading(null);
    }
  };

  const buildDateParams = (desde: string, hasta: string) => {
    const params = new URLSearchParams();
    if (desde) params.set('fecha_desde', desde);
    if (hasta) params.set('fecha_hasta', hasta);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Inventario General */}
        <div className="card border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Inventario General</h3>
              <p className="text-xs text-gray-500">Reporte completo del inventario actual</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Genera un reporte con todos los recursos, cantidades de entrada, salida y existencia actual.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => downloadFile('/reportes/inventario/excel', 'inventario.xlsx', 'inv-excel')}
              disabled={downloading === 'inv-excel'}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'inv-excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button
              onClick={() => downloadFile('/reportes/inventario/pdf', 'inventario.pdf', 'inv-pdf')}
              disabled={downloading === 'inv-pdf'}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'inv-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>

        {/* Reporte de Entradas */}
        <div className="card border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte de Entradas</h3>
              <p className="text-xs text-gray-500">Entradas de recursos al almacén</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Detalle de todas las entradas registradas en el rango de fechas seleccionado.
          </p>
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={entradasDesde}
                  onChange={(e) => setEntradasDesde(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={entradasHasta}
                  onChange={(e) => setEntradasHasta(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                downloadFile(
                  `/reportes/entradas/excel${buildDateParams(entradasDesde, entradasHasta)}`,
                  'entradas.xlsx',
                  'ent-excel'
                )
              }
              disabled={downloading === 'ent-excel'}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'ent-excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button
              onClick={() =>
                downloadFile(
                  `/reportes/entradas/pdf${buildDateParams(entradasDesde, entradasHasta)}`,
                  'entradas.pdf',
                  'ent-pdf'
                )
              }
              disabled={downloading === 'ent-pdf'}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'ent-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>

        {/* Reporte de Salidas */}
        <div className="card border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <ArrowUpFromLine className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte de Salidas</h3>
              <p className="text-xs text-gray-500">Salidas de recursos del almacén</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Detalle de todas las salidas registradas en el rango de fechas seleccionado.
          </p>
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={salidasDesde}
                  onChange={(e) => setSalidasDesde(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={salidasHasta}
                  onChange={(e) => setSalidasHasta(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                downloadFile(
                  `/reportes/salidas/excel${buildDateParams(salidasDesde, salidasHasta)}`,
                  'salidas.xlsx',
                  'sal-excel'
                )
              }
              disabled={downloading === 'sal-excel'}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'sal-excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button
              onClick={() =>
                downloadFile(
                  `/reportes/salidas/pdf${buildDateParams(salidasDesde, salidasHasta)}`,
                  'salidas.pdf',
                  'sal-pdf'
                )
              }
              disabled={downloading === 'sal-pdf'}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {downloading === 'sal-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
