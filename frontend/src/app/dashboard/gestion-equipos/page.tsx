'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import EquiposTab from './EquiposTab';
import SalidaEquiposTab from './SalidaEquiposTab';
import EntradaEquiposTab from './EntradaEquiposTab';
import { Wrench, Truck, ArrowDownToLine } from 'lucide-react';

type Tab = 'equipos' | 'salida-equipos' | 'entrada-equipos';

interface Persona {
  id: number;
  nombre: string;
}

interface FrenteTrabajo {
  id: number;
  nombre: string;
}

const TABS = [
  { id: 'equipos' as const, label: 'Equipos', icon: Wrench },
  { id: 'entrada-equipos' as const, label: 'Entrada Equipos', icon: ArrowDownToLine },
  { id: 'salida-equipos' as const, label: 'Salida Equipos', icon: Truck },
];

export default function GestionEquiposPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get('tab') as Tab) || 'equipos';
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [frentesTrabajo, setFrentesTrabajo] = useState<FrenteTrabajo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/personas/activos'),
      api.get('/frentes-trabajo/activos'),
    ]).then(([pRes, ftRes]) => {
      setPersonas(pRes.data);
      setFrentesTrabajo(ftRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setTab = (tab: Tab) => {
    router.replace(`/dashboard/gestion-equipos?tab=${tab}`);
  };

  return (
    <div className="space-y-4">
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

      {!loading && (
        <>
          {activeTab === 'equipos' && <EquiposTab />}
          {activeTab === 'salida-equipos' && <SalidaEquiposTab personas={personas} frentesTrabajo={frentesTrabajo} />}
          {activeTab === 'entrada-equipos' && <EntradaEquiposTab personas={personas} frentesTrabajo={frentesTrabajo} />}
        </>
      )}
    </div>
  );
}
