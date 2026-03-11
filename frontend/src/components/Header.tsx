'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Pencil, LogOut, ChevronDown, Shield } from 'lucide-react';
import ProfileModal from '@/components/ProfileModal';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: 'Resumen general del almacén' },
  '/dashboard/inventario': { title: 'Inventario', description: 'Gestión de recursos y existencias' },
  '/dashboard/entradas': { title: 'Registro de Entradas', description: 'Control de ingresos al almacén' },
  '/dashboard/salidas': { title: 'Registro de Salidas', description: 'Control de despachos del almacén' },
  '/dashboard/equipos': { title: 'Equipos', description: 'Gestión de equipos y herramientas' },
  '/dashboard/salida-equipos': { title: 'Salida de Equipos', description: 'Control de préstamo de equipos' },
  '/dashboard/movimientos': { title: 'Movimientos', description: 'Historial de operaciones' },
  '/dashboard/reportes': { title: 'Reportes', description: 'Generación de informes' },
  '/dashboard/usuarios': { title: 'Gestión de Usuarios', description: 'Administración de cuentas' },
  '/dashboard/categorias': { title: 'Categorías', description: 'Clasificación de recursos' },
  '/dashboard/unidades-medida': { title: 'Unidades de Medida', description: 'Configuración de unidades' },
  '/dashboard/personas': { title: 'Personas', description: 'Proveedores, trabajadores y transportistas' },
  '/dashboard/frentes-trabajo': { title: 'Frentes de Trabajo', description: 'Ubicaciones de trabajo' },
  '/dashboard/medios-transporte': { title: 'Medios de Transporte', description: 'Vehículos registrados' },
};

const rolLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  ALMACENERO: 'Almacenero',
  SUPERVISOR: 'Supervisor',
};

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const page = pageTitles[pathname] || { title: 'KardexChio', description: '' };

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<'view' | 'edit'>('view');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const fullName = user?.nombre
    ? `${user.nombre} ${user.apellido_paterno || ''}`.trim()
    : user?.documento || 'Usuario';

  const initials = user?.nombre
    ? `${user.nombre.charAt(0)}${user.apellido_paterno?.charAt(0) || ''}`
    : user?.documento?.charAt(0) || 'U';

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 sticky top-0 z-30">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{page.title}</h2>
          {page.description && (
            <p className="text-xs text-gray-400 -mt-0.5">{page.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                menuOpen ? 'bg-gray-100' : ''
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-700 leading-tight">{fullName}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{rolLabels[user?.rol || ''] || user?.rol}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Shield className="w-3 h-3 text-primary-500" />
                        <span className="text-xs text-gray-500">{rolLabels[user?.rol || ''] || user?.rol}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {user?.tipo_documento}: {user?.documento}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileMode('view');
                      setProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Ver perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileMode('edit');
                      setProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                    <span>Editar información</span>
                  </button>
                </div>

                {/* Divider + Logout */}
                <div className="border-t border-gray-100 p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {profileOpen && (
        <ProfileModal
          mode={profileMode}
          onClose={() => setProfileOpen(false)}
          onSwitchMode={(mode) => setProfileMode(mode)}
        />
      )}
    </>
  );
}
