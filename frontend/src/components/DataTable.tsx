'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface Column {
  header: string;
  key: string;
  render?: (item: any) => React.ReactNode;
  className?: string;
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-52">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary-900">
              {showRowNumber && (
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 border border-primary-700">
                  N°
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider border border-primary-700 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showRowNumber ? 1 : 0)} className="px-4 py-16 text-center border border-gray-200">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Inbox className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`transition-colors hover:bg-primary-50/40 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {showRowNumber && (
                    <td className="px-4 py-3 text-center text-gray-400 font-medium text-xs border border-gray-200">
                      {rowNumberOffset + index + 1}
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-gray-700 border border-gray-200 ${col.className || ''}`}>
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
