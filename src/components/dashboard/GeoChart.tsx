"use client";

import { useGeoMetrics } from '@/hooks/useMetrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  'var(--chart-1)', 
  'var(--chart-2)', 
  'var(--chart-3)', 
  'var(--chart-4)', 
  'var(--chart-5)', 
  'var(--chart-6)',
  '#475569', // extra fallbacks se > 6 países
  '#334155',
  '#1e293b'
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function GeoChart() {
  const { data, isLoading } = useGeoMetrics();

  if (isLoading) return <div className="h-80 bg-bg-card rounded-xl border border-border-subtle animate-pulse" />;

  const geo: { country: string; count: number; revenue: number; share: number }[] = data?.geo ?? [];

  if (geo.length === 0) {
    return (
      <div className="bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card flex items-center justify-center h-80 text-text-tertiary">
        Sem dados geográficos no período
      </div>
    );
  }

  const top10 = geo.slice(0, 10);
  const others = geo.slice(10);
  const othersRevenue = others.reduce((s, g) => s + g.revenue, 0);
  const chartData = othersRevenue > 0
    ? [...top10, { country: 'Outros', revenue: othersRevenue, count: 0, share: 0 }]
    : top10;

  return (
    <div className="bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card hover:shadow-hover transition-all duration-200 flex flex-col">
      <div className="mb-4 pb-4 border-b border-border-subtle shrink-0">
        <h3 className="text-lg font-semibold text-text-primary">Distribuição Geográfica</h3>
        <p className="text-sm text-text-secondary mt-1">Receita líquida por país</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[250px]">
        {/* Gráfico Rosca */}
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                dataKey="revenue"
                nameKey="country"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={((val: any) => [formatCurrency(Number(val)), 'Receita']) as any}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela lateral */}
        <div className="w-full md:w-56 overflow-y-auto space-y-3 shrink-0">
          {geo.map((g, i) => (
            <div key={g.country} className="flex items-center justify-between text-sm py-1 border-b border-border-subtle last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-glow"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-text-primary truncate">{g.country}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span className="font-semibold text-text-primary">{g.share.toFixed(1)}%</span>
                <span className="text-text-tertiary text-xs ml-2">{g.count}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
