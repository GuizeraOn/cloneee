"use client";

import { useGeoMetrics } from '@/hooks/useMetrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6', '#a855f7'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function GeoChart() {
  const { data, isLoading } = useGeoMetrics();

  if (isLoading) return <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />;

  const geo: { country: string; count: number; revenue: number; share: number }[] = data?.geo ?? [];

  if (geo.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center h-64 text-gray-400">
        Sem dados geográficos no período
      </div>
    );
  }

  // Recharts Pie: top 10 países + "Outros" se houver mais
  const top10 = geo.slice(0, 10);
  const others = geo.slice(10);
  const othersRevenue = others.reduce((s, g) => s + g.revenue, 0);
  const chartData = othersRevenue > 0
    ? [...top10, { country: 'Outros', revenue: othersRevenue, count: 0, share: 0 }]
    : top10;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Distribuição Geográfica</h3>
      <p className="text-xs text-gray-400 mb-4">Receita líquida por país — vendas aprovadas</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Gráfico Rosca */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="revenue"
                nameKey="country"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((val: any) => [formatCurrency(Number(val)), 'Receita']) as any}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela lateral */}
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {geo.map((g, i) => (
            <div key={g.country} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-gray-700 truncate">{g.country}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span className="font-semibold text-gray-900">{g.share.toFixed(1)}%</span>
                <span className="text-gray-400 text-xs ml-2">{g.count} vendas</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
