"use client";

import { useFunnelMetrics } from '@/hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STAGE_COLORS: Record<string, string> = {
  FRONTEND:   '#4f46e5',
  ORDER_BUMP: '#10b981',
  UPSELL_01:  '#f59e0b',
  UPSELL_02:  '#ef4444',
  DOWNSELL:   '#8b5cf6',
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function FunnelChart() {
  const { data, isLoading } = useFunnelMetrics();

  if (isLoading) return <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />;

  const funnel: any[] = data?.funnel ?? [];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Funil de Conversão</h3>
      <p className="text-xs text-gray-400 mb-4">Vendas aprovadas por etapa</p>

      {/* Gráfico de barras */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={((value: any, name: any) => [
                name === 'netBrl' ? formatCurrency(Number(value)) : value,
                name === 'netBrl' ? 'Líquido R$' : 'Aprovados',
              ]) as any}
            />
            <Bar dataKey="approvedCount" radius={[0, 4, 4, 0]} barSize={20}>
              {funnel.map((entry: any) => (
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Take Rates */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        {funnel.map((row: any) => (
          <div key={row.stage} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: STAGE_COLORS[row.stage] ?? '#6b7280' }}
              />
              <span className="text-gray-700 font-medium">{row.label}</span>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-gray-500 text-xs">{row.approvedCount} vendas</span>
              <span className="text-gray-800 font-semibold text-xs w-20 text-right">
                {formatCurrency(row.netBrl)}
              </span>
              {row.takeRateFromFrontend !== null && (
                <span className="text-indigo-600 font-bold text-xs w-16 text-right">
                  {row.takeRateFromFrontend.toFixed(1)}% TR
                </span>
              )}
              {row.takeRateFromUpsell01 !== null && (
                <span className="text-orange-500 font-bold text-xs w-20 text-right">
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
