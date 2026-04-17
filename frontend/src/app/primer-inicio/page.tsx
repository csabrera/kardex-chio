'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { showError, showSuccess } from '@/lib/swal';
import { Check, Lock, User } from 'lucide-react';

export default function PrimerInicioPage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2 state
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    email: '',
    direccion: '',
  });
  const [step2Loading, setStep2Loading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
    if (!isLoading && user && !user.primer_inicio) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNuevo !== passwordConfirm) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (passwordNuevo.length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setStep1Loading(true);
    try {
      await api.post('/auth/cambiar-password', {
        password_actual: passwordActual,
        password_nuevo: passwordNuevo,
      });
      showSuccess('Contraseña actualizada');
      setStep(2);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setStep1Loading(false);
    }
  };

  const validatePerfil = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!perfil.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!perfil.apellido_paterno.trim()) newErrors.apellido_paterno = 'El apellido paterno es obligatorio';
    if (!perfil.apellido_materno.trim()) newErrors.apellido_materno = 'El apellido materno es obligatorio';
    if (!perfil.celular.trim()) {
      newErrors.celular = 'El celular es obligatorio';
    } else if (!/^9\d{8}$/.test(perfil.celular)) {
      newErrors.celular = 'Debe ser un número de 9 dígitos que empiece con 9';
    }
    if (!perfil.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!perfil.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePerfil()) return;

    setStep2Loading(true);
    try {
      await api.post('/auth/completar-perfil', perfil);
      updateUser({ ...perfil, primer_inicio: false });

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Tu perfil ha sido completado exitosamente',
        confirmButtonColor: '#2563eb',
      });

      router.push('/dashboard');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al completar perfil');
    } finally {
      setStep2Loading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 py-8">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Primer Inicio de Sesión</h1>
            <p className="text-gray-500 mt-1">Complete los siguientes pasos para continuar</p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 1 ? 'bg-primary-600 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {step > 1 ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Contraseña
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <User className="w-4 h-4" />
              Datos Personales
            </div>
          </div>

          {/* Step 1: Change Password */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                Por seguridad, debe cambiar su contraseña temporal antes de continuar.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} className="input-field" placeholder="Ingrese su contraseña actual" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input type="password" value={passwordNuevo} onChange={(e) => setPasswordNuevo(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="input-field" placeholder="Repita la nueva contraseña" required />
              </div>
              <button type="submit" disabled={step1Loading} className="w-full btn-primary py-3 disabled:opacity-50">
                {step1Loading ? 'Guardando...' : 'Cambiar Contraseña y Continuar'}
              </button>
            </form>
          )}

          {/* Step 2: Complete Profile */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                Complete sus datos personales para finalizar el registro.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} className={`input-field ${errors.nombre ? 'border-red-500' : ''}`} placeholder="Juan" maxLength={100} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                  <input type="text" value={perfil.apellido_paterno} onChange={(e) => setPerfil({ ...perfil, apellido_paterno: e.target.value })} className={`input-field ${errors.apellido_paterno ? 'border-red-500' : ''}`} maxLength={100} />
                  {errors.apellido_paterno && <p className="text-red-500 text-xs mt-1">{errors.apellido_paterno}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                  <input type="text" value={perfil.apellido_materno} onChange={(e) => setPerfil({ ...perfil, apellido_materno: e.target.value })} className={`input-field ${errors.apellido_materno ? 'border-red-500' : ''}`} maxLength={100} />
                  {errors.apellido_materno && <p className="text-red-500 text-xs mt-1">{errors.apellido_materno}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                  <input type="text" value={perfil.celular} onChange={(e) => setPerfil({ ...perfil, celular: e.target.value.replace(/\D/g, '').slice(0, 9) })} className={`input-field ${errors.celular ? 'border-red-500' : ''}`} placeholder="987654321" maxLength={9} />
                  {errors.celular && <p className="text-red-500 text-xs mt-1">{errors.celular}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} className={`input-field ${errors.email ? 'border-red-500' : ''}`} placeholder="correo@ejemplo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" value={perfil.direccion} onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })} className={`input-field ${errors.direccion ? 'border-red-500' : ''}`} placeholder="Av. Principal 123, Lima" maxLength={300} />
                {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>}
              </div>
              <button type="submit" disabled={step2Loading} className="w-full btn-primary py-3 disabled:opacity-50">
                {step2Loading ? 'Guardando...' : 'Completar Registro'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
