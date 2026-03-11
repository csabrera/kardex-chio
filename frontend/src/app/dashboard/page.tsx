'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardData {
  resumen: {
    total_recursos: number;
    total_registros_entradas: number;
    cantidad_total_entradas: number;
    total_registros_salidas: number;
    cantidad_total_salidas: number;
    recursos_agotados: number;
    total_equipos: number;
  };
  categorias: { nombre: string; total: string }[];
  alertas: {
    id: number;
    codigo: string;
    nombre: string;
    categoria: string;
    existencia_actual: number;
    status: string;
  }[];
  movimientos_recientes: {
    id: number;
    tipo: string;
    cantidad: number;
    fecha: string;
    descripcion: string;
    recurso_nombre: string;
    recurso_codigo: string;
    equipo_nombre: string;
  }[];
  entradas_por_mes: { mes: string; total: string; cantidad: string }[];
  salidas_por_mes: { mes: string; total: string; cantidad: string }[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      ring: 'ring-blue-500/20',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-500',
      text: 'text-emerald-600',
      ring: 'ring-emerald-500/20',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500',
      text: 'text-amber-600',
      ring: 'ring-amber-500/20',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      ring: 'ring-red-500/20',
    },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {value.toLocaleString()}
            </p>
          </div>
          {subtitle && (
            <p className={`text-sm mt-1 ${c.text} font-medium`}>{subtitle}</p>
          )}
        </div>
        <div className={`${c.icon} p-3 rounded-xl shadow-sm ring-4 ${c.ring} group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-400" />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((item: any) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-gray-500">{item.name}:</span>
          <span className="font-semibold text-gray-800">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Error al cargar el dashboard</p>
        </div>
      </div>
    );
  }

  const { resumen, alertas, movimientos_recientes, categorias } = data;

  const allMonths = new Set([
    ...data.entradas_por_mes.map((e) => e.mes),
    ...data.salidas_por_mes.map((s) => s.mes),
  ]);
  const chartData = Array.from(allMonths)
    .sort()
    .map((mes) => ({
      mes,
      entradas: parseFloat(data.entradas_por_mes.find((e) => e.mes === mes)?.cantidad || '0'),
      salidas: parseFloat(data.salidas_por_mes.find((s) => s.mes === mes)?.cantidad || '0'),
    }));

  const maxCatTotal = Math.max(...categorias.map(c => parseInt(c.total) || 0), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Recursos"
          value={resumen.total_recursos}
          subtitle={`${resumen.total_equipos} equipos`}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Entradas"
          value={resumen.total_registros_entradas}
          subtitle={`${resumen.cantidad_total_entradas.toLocaleString()} unidades`}
          icon={ArrowDownToLine}
          color="emerald"
        />
        <StatCard
          title="Salidas"
          value={resumen.total_registros_salidas}
          subtitle={`${resumen.cantidad_total_salidas.toLocaleString()} unidades`}
          icon={ArrowUpFromLine}
          color="amber"
        />
        <StatCard
          title="Agotados"
          value={resumen.recursos_agotados}
          subtitle={resumen.recursos_agotados > 0 ? 'Requieren atención' : 'Todo en orden'}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Chart + Categories Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <SectionHeader icon={BarChart3} title="Entradas vs Salidas por Mes" />
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="salidas" fill="#f59e0b" name="Salidas" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Sin datos para mostrar</p>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <SectionHeader icon={Boxes} title="Por Categoría" />
          <div className="space-y-3">
            {categorias.map((cat) => {
              const percentage = (parseInt(cat.total) / maxCatTotal) * 100;
              return (
                <div key={cat.nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 truncate pr-2">{cat.nombre}</span>
                    <span className="text-sm font-bold text-gray-900">{cat.total}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts + Recent Movements Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <SectionHeader
            icon={AlertTriangle}
            title="Alertas de Stock"
            action={
              alertas.length > 0 ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-500/20">
                  {alertas.length} agotados
                </span>
              ) : null
            }
          />
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="font-medium text-gray-500">Todo en orden</p>
                <p className="text-sm">No hay recursos agotados</p>
              </div>
            ) : (
              alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{alerta.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {alerta.codigo} &middot; {alerta.categoria}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                      {alerta.existencia_actual} uds.
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <SectionHeader icon={Clock} title="Movimientos Recientes" />
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {movimientos_recientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-medium text-gray-500">Sin movimientos</p>
                <p className="text-sm">Aún no se registran operaciones</p>
              </div>
            ) : (
              movimientos_recientes.map((mov) => {
                const isEntry = mov.tipo === 'ENTRADA';
                return (
                  <div
                    key={mov.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isEntry
                        ? 'bg-emerald-50 ring-1 ring-emerald-500/10'
                        : 'bg-amber-50 ring-1 ring-amber-500/10'
                    }`}>
                      {isEntry ? (
                        <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {mov.recurso_nombre || mov.equipo_nombre}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{mov.descripcion}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${
                        isEntry ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {isEntry ? '+' : '-'}{mov.cantidad}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(mov.fecha).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
