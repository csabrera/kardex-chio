'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Wrench,
  Truck,
  History,
  FileSpreadsheet,
  Users,
  Box,
  Tags,
  Ruler,
  Contact,
  HardHat,
  TruckIcon,
  Settings,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recursos', href: '/dashboard/recursos', icon: Package },
  { name: 'Equipos', href: '/dashboard/equipos', icon: Wrench },
  { name: 'Salida Equipos', href: '/dashboard/salida-equipos', icon: Truck },
  { name: 'Entrada Equipos', href: '/dashboard/entrada-equipos', icon: ArrowDownToLine },
  { name: 'Movimientos', href: '/dashboard/movimientos', icon: History },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileSpreadsheet },
];

const adminNavigation = [
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users },
  { name: 'Categorías', href: '/dashboard/categorias', icon: Tags },
  { name: 'Unidades de Medida', href: '/dashboard/unidades-medida', icon: Ruler },
  { name: 'Personas', href: '/dashboard/personas', icon: Contact },
  { name: 'Frentes de Trabajo', href: '/dashboard/frentes-trabajo', icon: HardHat },
  { name: 'Medios de Transporte', href: '/dashboard/medios-transporte', icon: TruckIcon },
];

function NavItem({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white/15 text-white shadow-sm shadow-black/10'
          : 'text-primary-200/80 hover:bg-white/8 hover:text-white'
      }`}
    >
      <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-primary-300/70 group-hover:text-white'}`} />
      <span className="flex-1">{item.name}</span>
      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.rol === 'ADMIN';

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-900 via-primary-900 to-primary-950 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur rounded-xl border border-white/10">
          <Box className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">KardexChio</h1>
          <p className="text-[11px] text-primary-300/60 font-medium">Control de Almacén</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-primary-400/60 uppercase tracking-widest">
          Principal
        </p>
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 mx-3 h-px bg-white/8" />
            <p className="px-3 mb-2 text-[10px] font-semibold text-primary-400/60 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3 h-3" />
              Administración
            </p>
            {adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
