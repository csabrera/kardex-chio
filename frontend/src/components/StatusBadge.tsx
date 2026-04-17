interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    'DISPONIBLE': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    'AGOTADO': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    'EN_ALMACEN': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    'SALIDA': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'INGRESO': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };

  const labels: Record<string, string> = {
    'EN_ALMACEN': 'En Almacén',
    'DISPONIBLE': 'Disponible',
  };

  const style = styles[status] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} badge-base`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {labels[status] || status}
    </span>
  );
}
