"use client";

import { useSummaryMetrics } from '@/hooks/useMetrics';
import { DollarSign, Users, TrendingUp, Activity, ShoppingCart, CheckCircle2 } from 'lucide-react';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatPct(val: number) {
  return `${val.toFixed(1)}%`;
}

export function SummaryCards() {
  const { data, isLoading, error } = useSummaryMetrics();

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
    </div>
  );

  if (error || !data) return (
    <div className="p-4 text-red-500 bg-red-50 rounded-xl">Erro ao carregar métricas</div>
  );

  const {
    totalApproved,
    grossRevenueBrl,
    netRevenueBrl,
    uniqueBuyers,
    aovBrl,
    takeRate,
    additionalRevenueBrl,
    additionalRevenueShare,
    approvalRate,
    totalEvents,
  } = data.metrics;

  const cards = [
    {
      title: 'Faturamento Líquido',
      value: formatCurrency(netRevenueBrl),
      subtitle: `Bruto: ${formatCurrency(grossRevenueBrl)}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Compradores Únicos',
      value: String(uniqueBuyers),
      subtitle: `${totalApproved} vendas aprovadas`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Ticket Médio (AOV)',
      value: formatCurrency(aovBrl),
      subtitle: `Take Rate: ${formatPct(takeRate)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Receita Adicional Funil',
      value: formatCurrency(additionalRevenueBrl),
      subtitle: `${formatPct(additionalRevenueShare)} do faturamento`,
      icon: ShoppingCart,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Taxa de Aprovação',
      value: formatPct(approvalRate),
      subtitle: `${totalApproved} de ${totalEvents} eventos`,
      icon: CheckCircle2,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'Faturamento Bruto',
      value: formatCurrency(grossRevenueBrl),
      subtitle: `Líquido: ${formatPct(takeRate)} do bruto`,
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{c.title}</h3>
              <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
