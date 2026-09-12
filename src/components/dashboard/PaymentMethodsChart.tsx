"use client";

import { usePaymentMethods } from '@/hooks/useMetrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Usando as cores semânticas de dados do DarkMetrics (1 a 5)
const COLORS = [
  'var(--chart-1)', 
  'var(--chart-2)', 
  'var(--chart-3)', 
  'var(--chart-4)', 
  'var(--chart-5)', 
  'var(--chart-6)'
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function PaymentMethodsChart() {
  const { data, isLoading } = usePaymentMethods();

  if (isLoading) return <div className="h-80 bg-bg-card rounded-xl border border-border-subtle animate-pulse" />;

  const chartData = data?.paymentMethods || [];

  return (
    <div className="bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card hover:shadow-hover transition-all duration-200">
      <div className="mb-4 pb-4 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary">Meios de Pagamento</h3>
        <p className="text-sm text-text-secondary mt-1">Receita líquida por método</p>
      </div>

      <div className="h-64">
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
              nameKey="method"
              stroke="none"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              formatter={((val: any) => [formatCurrency(Number(val)), 'Receita']) as any} 
            />
            <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
