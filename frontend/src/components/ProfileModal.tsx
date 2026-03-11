'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Shield, FileText, Pencil, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { showError } from '@/lib/swal';
import Swal from 'sweetalert2';

interface ProfileData {
  id: string;
  tipo_documento: string;
  documento: string;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  celular: string | null;
  email: string | null;
  direccion: string | null;
  rol: string;
  created_at: string;
}

interface ProfileModalProps {
  mode: 'view' | 'edit';
  onClose: () => void;
  onSwitchMode: (mode: 'view' | 'edit') => void;
}

const rolLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  ALMACENERO: 'Almacenero',
  SUPERVISOR: 'Supervisor',
};

export default function ProfileModal({ mode, onClose, onSwitchMode }: ProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    email: '',
    direccion: '',
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    api.get('/auth/profile')
      .then((res) => {
        setProfile(res.data);
        setForm({
          nombre: res.data.nombre || '',
          apellido_paterno: res.data.apellido_paterno || '',
          apellido_materno: res.data.apellido_materno || '',
          celular: res.data.celular || '',
          email: res.data.email || '',
          direccion: res.data.direccion || '',
        });
      })
      .catch(() => showError('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido_paterno.trim() || !form.apellido_materno.trim()) {
      showError('Nombre y apellidos son obligatorios');
      return;
    }
    if (form.celular && !/^9\d{8}$/.test(form.celular)) {
      showError('El celular debe ser un número peruano de 9 dígitos');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showError('Ingrese un email válido');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/auth/completar-perfil', form);
      setProfile(res.data);
      updateUser({
        nombre: res.data.nombre,
        apellido_paterno: res.data.apellido_paterno,
        apellido_materno: res.data.apellido_materno,
      });
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tu información ha sido guardada correctamente',
        timer: 2000,
        showConfirmButton: false,
      });
      onSwitchMode('view');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const fullName = profile
    ? [profile.nombre, profile.apellido_paterno, profile.apellido_materno].filter(Boolean).join(' ')
    : '';

  const initials = profile?.nombre
    ? `${profile.nombre.charAt(0)}${profile.apellido_paterno?.charAt(0) || ''}`
    : user?.documento?.charAt(0) || 'U';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 px-6 pt-6 pb-12">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-primary-200 text-sm font-medium">
            {mode === 'view' ? 'Mi Perfil' : 'Editar Perfil'}
          </p>
        </div>

        {/* Avatar floating */}
        <div className="flex justify-center -mt-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-white">
            {initials}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : mode === 'view' ? (
          /* ========== VIEW MODE ========== */
          <div className="px-6 pt-3 pb-6">
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">{fullName || 'Sin nombre'}</h3>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-primary-50 rounded-full">
                <Shield className="w-3 h-3 text-primary-600" />
                <span className="text-xs font-medium text-primary-700">
                  {rolLabels[profile?.rol || ''] || profile?.rol}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow icon={FileText} label="Documento" value={`${profile?.tipo_documento}: ${profile?.documento}`} />
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
              <InfoRow icon={Phone} label="Celular" value={profile?.celular} />
              <InfoRow icon={MapPin} label="Dirección" value={profile?.direccion} />
              <InfoRow
                icon={User}
                label="Miembro desde"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
              />
            </div>

            <button
              onClick={() => onSwitchMode('edit')}
              className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar información
            </button>
          </div>
        ) : (
          /* ========== EDIT MODE ========== */
          <div className="px-6 pt-3 pb-6">
            <div className="text-center mb-4">
              <h3 className="text-base font-semibold text-gray-900">Editar información</h3>
              <p className="text-xs text-gray-400">Actualiza tus datos personales</p>
            </div>

            <div className="space-y-3">
              <EditField label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
              <EditField label="Apellido Paterno" value={form.apellido_paterno} onChange={(v) => setForm({ ...form, apellido_paterno: v })} required />
              <EditField label="Apellido Materno" value={form.apellido_materno} onChange={(v) => setForm({ ...form, apellido_materno: v })} required />
              <EditField label="Celular" value={form.celular} onChange={(v) => setForm({ ...form, celular: v.replace(/\D/g, '').slice(0, 9) })} placeholder="987654321" />
              <EditField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="correo@ejemplo.com" type="email" />
              <EditField label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} placeholder="Av. Principal 123" />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => onSwitchMode('view')}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50/80">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field bg-white text-sm"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
