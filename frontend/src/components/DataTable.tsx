'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface Column {
  header: string;
  key: string;
  render?: (item: any) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  maxWidth?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  showRowNumber?: boolean;
  rowNumberOffset?: number;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  showRowNumber = true,
  rowNumberOffset = 0,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center h-52">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleColumns = columns.filter(col => !col.hideOnMobile);

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr className="bg-slate-800 border-b border-slate-200">
              {showRowNumber && (
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-12 flex-shrink-0">
                  N°
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider ${col.className || ''}`}
                  style={col.maxWidth ? { maxWidth: col.maxWidth } : {}}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (showRowNumber ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                      <Inbox className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className="bg-white hover:bg-teal-50/40 transition-colors duration-150"
                >
                  {showRowNumber && (
                    <td className="px-4 py-3.5 text-center text-slate-400 font-medium text-xs flex-shrink-0 w-12">
                      {rowNumberOffset + index + 1}
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-slate-700 ${col.maxWidth ? 'truncate' : ''} ${col.className || ''}`}
                      style={col.maxWidth ? { maxWidth: col.maxWidth } : {}}
                      title={typeof item[col.key] === 'string' ? item[col.key] : ''}
                    >
                      {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
