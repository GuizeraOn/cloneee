"use client";

import { useFunnelMetrics } from '@/hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Usando as cores semânticas de dados do DarkMetrics (1 a 5)
const STAGE_COLORS: Record<string, string> = {
  FRONTEND:   'var(--chart-1)',
  ORDER_BUMP: 'var(--chart-2)',
  UPSELL_01:  'var(--chart-3)',
  UPSELL_02:  'var(--chart-4)',
  DOWNSELL:   'var(--chart-5)',
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function FunnelChart() {
  const { data, isLoading } = useFunnelMetrics();

  if (isLoading) return <div className="h-80 bg-bg-card rounded-xl border border-border-subtle animate-pulse" />;

  const funnel: any[] = data?.funnel ?? [];

  return (
    <div className="bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card hover:shadow-hover transition-all duration-200">
      <div className="mb-4 pb-4 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary">Funil de Conversão</h3>
        <p className="text-sm text-text-secondary mt-1">Vendas aprovadas por etapa</p>
      </div>

      {/* Gráfico de barras */}
      <div className="h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={90} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
              axisLine={{ stroke: 'var(--border-subtle)' }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-card-hover)' }}
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              formatter={((value: any, name: any) => [
                name === 'netBrl' ? formatCurrency(Number(value)) : value,
                name === 'netBrl' ? 'Líquido R$' : 'Aprovados',
              ]) as any}
            />
            <Bar dataKey="approvedCount" radius={[0, 4, 4, 0]} barSize={24}>
              {funnel.map((entry: any) => (
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? 'var(--chart-6)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Take Rates (Legenda detalhada) */}
      <div className="space-y-3">
        {funnel.map((row: any) => (
          <div key={row.stage} className="flex items-center justify-between text-sm py-2 border-b border-border-subtle last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shadow-glow"
                style={{ backgroundColor: STAGE_COLORS[row.stage] ?? 'var(--chart-6)' }}
              />
              <span className="text-text-primary font-medium">{row.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-tertiary">{row.approvedCount} vendas</span>
              <span className="text-text-primary font-bold w-24 text-right">
                {formatCurrency(row.netBrl)}
              </span>
              {row.takeRateFromFrontend !== null && (
                <span className="text-chart-1 font-bold w-16 text-right">
                  {row.takeRateFromFrontend.toFixed(1)}% TR
                </span>
              )}
              {row.takeRateFromUpsell01 !== null && (
                <span className="text-chart-4 font-bold w-20 text-right">
                  {row.takeRateFromUpsell01.toFixed(1)}% U1→U2
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
