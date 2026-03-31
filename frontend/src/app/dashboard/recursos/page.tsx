'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import InventarioTab from './InventarioTab';
import EntradasTab from './EntradasTab';
import SalidasTab from './SalidasTab';
import { Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

type Tab = 'inventario' | 'entradas' | 'salidas';

interface Categoria {
  id: number;
  nombre: string;
}

const TABS = [
  { id: 'inventario' as const, label: 'Inventario', icon: Package },
  { id: 'entradas' as const, label: 'Entradas', icon: ArrowDownToLine },
  { id: 'salidas' as const, label: 'Salidas', icon: ArrowUpFromLine },
];

export default function RecursosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get('tab') as Tab) || 'inventario';
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categorias')
      .then((res) => setCategorias(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setTab = (tab: Tab) => {
    router.replace(`/dashboard/recursos?tab=${tab}`);
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="card p-1 flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!loading && (
        <>
          {activeTab === 'inventario' && <InventarioTab categorias={categorias} />}
          {activeTab === 'entradas' && <EntradasTab categorias={categorias} />}
          {activeTab === 'salidas' && <SalidasTab categorias={categorias} />}
        </>
      )}
    </div>
  );
}
