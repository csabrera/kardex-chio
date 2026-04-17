'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { showError } from '@/lib/swal';

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI', maxLength: 8, pattern: /^\d{8}$/, placeholder: '12345678' },
  { value: 'CE', label: 'Carné de Extranjería', maxLength: 9, pattern: /^[a-zA-Z0-9]{1,9}$/, placeholder: 'ABC123456' },
  { value: 'PASAPORTE', label: 'Pasaporte', maxLength: 12, pattern: /^[a-zA-Z0-9]{1,12}$/, placeholder: 'AB1234567' },
];

export default function LoginPage() {
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const docType = DOCUMENT_TYPES.find(d => d.value === tipoDocumento)!;

  const handleDocumentoChange = (value: string) => {
    if (tipoDocumento === 'DNI') {
      setDocumento(value.replace(/\D/g, '').slice(0, 8));
    } else {
      setDocumento(value.replace(/[^a-zA-Z0-9]/g, '').slice(0, docType.maxLength));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docType.pattern.test(documento)) {
      showError(`El ${docType.label} ingresado no es válido`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_documento: tipoDocumento, documento, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || 'Credenciales incorrectas');
        return;
      }

      authLogin(data.access_token, data.user);

      if (data.user.primer_inicio) {
        router.push('/primer-inicio');
      } else {
        router.push('/dashboard');
      }
    } catch {
      showError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — Imagen */}
      <div className="hidden lg:flex lg:w-[65%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900">
        <Image
          src="/warehouse-bg.jpg"
          alt="Almacén"
          fill
          className="object-cover opacity-40"
          priority
        />
        {/* Patrón geométrico sutil */}
        <svg className="absolute inset-0 opacity-5" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/50 to-teal-900/40" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-3xl font-bold tracking-tight">KardexChio</span>
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Sistema de Control<br />de Almacén
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Gestiona tu inventario de forma eficiente. Controla entradas, salidas, equipos y genera reportes en tiempo real.
            </p>
            <div className="flex gap-8 mt-8">
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Inventario en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Reportes PDF y Excel</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/30">KardexChio v1.0</p>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="w-full lg:w-[35%] flex flex-col items-center justify-center bg-slate-50 px-6 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">KardexChio</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Iniciar Sesión</h2>
            <p className="text-slate-600 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Documento
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => { setTipoDocumento(e.target.value); setDocumento(''); }}
                className="input-field"
              >
                {DOCUMENT_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                N° de Documento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) => handleDocumentoChange(e.target.value)}
                  className="input-field pl-10"
                  placeholder={docType.placeholder}
                  required
                  maxLength={docType.maxLength}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Ingrese su contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            KardexChio v1.0 — Sistema de Control de Almacén
          </p>
        </div>
      </div>
    </div>
  );
}
