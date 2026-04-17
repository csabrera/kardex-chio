'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Wrench,
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
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recursos', href: '/dashboard/recursos', icon: Package },
  { name: 'Equipos', href: '/dashboard/gestion-equipos', icon: Wrench },
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
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-500 transition-all duration-200 relative ${
        isActive
          ? 'text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600 rounded-r" />
      )}
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{item.name}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.rol === 'ADMIN';

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] bg-slate-900 text-white flex-col z-50 border-r border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-lg">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">KardexChio</h1>
            <p className="text-xs text-slate-400 font-medium">Control de Almacén</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Principal
          </p>
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
          ))}

          {isAdmin && (
            <>
              <div className="my-6 h-px bg-slate-800" />
              <p className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Administración
              </p>
              {adminNavigation.map((item) => (
                <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
              ))}
            </>
          )}
        </nav>

        {/* Footer hint */}
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">KardexChio v1.0</p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-slate-900 text-white flex flex-col z-50 lg:hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl">
              <Box className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">KardexChio</h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Principal
          </p>
          {navigation.map((item) => (
            <div key={item.name} onClick={onClose}>
              <NavItem item={item} isActive={isActive(item.href)} />
            </div>
          ))}

          {isAdmin && (
            <>
              <div className="my-6 h-px bg-slate-800" />
              <p className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Administración
              </p>
              {adminNavigation.map((item) => (
                <div key={item.name} onClick={onClose}>
                  <NavItem item={item} isActive={isActive(item.href)} />
                </div>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
