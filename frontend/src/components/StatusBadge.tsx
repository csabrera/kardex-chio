interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    'DISPONIBLE': 'bg-emerald-100 text-emerald-700',
    'AGOTADO': 'bg-red-100 text-red-700',
    'EN_ALMACEN': 'bg-blue-100 text-blue-700',
    'SALIDA': 'bg-orange-100 text-orange-700',
    'INGRESO': 'bg-green-100 text-green-700',
  };

  const labels: Record<string, string> = {
    'EN_ALMACEN': 'En Almacén',
    'DISPONIBLE': 'Disponible',
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}
