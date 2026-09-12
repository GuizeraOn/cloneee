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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-bg-card rounded-xl border border-border-subtle" />)}
    </div>
  );

  if (error || !data) return (
    <div className="p-4 text-danger bg-danger-bg rounded-xl border border-danger">Erro ao carregar métricas</div>
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
      color: 'text-success', // Main accent
    },
    {
      title: 'Compradores Únicos',
      value: String(uniqueBuyers),
      subtitle: `${totalApproved} vendas aprovadas`,
      icon: Users,
      color: 'text-info',
    },
    {
      title: 'Ticket Médio (AOV)',
      value: formatCurrency(aovBrl),
      subtitle: `Take Rate: ${formatPct(takeRate)}`,
      icon: TrendingUp,
      color: 'text-chart-3',
    },
    {
      title: 'Receita Adicional Funil',
      value: formatCurrency(additionalRevenueBrl),
      subtitle: `${formatPct(additionalRevenueShare)} do faturamento`,
      icon: ShoppingCart,
      color: 'text-chart-4',
    },
    {
      title: 'Taxa de Aprovação',
      value: formatPct(approvalRate),
      subtitle: `${totalApproved} de ${totalEvents} eventos`,
      icon: CheckCircle2,
      color: 'text-chart-2',
    },
    {
      title: 'Faturamento Bruto',
      value: formatCurrency(grossRevenueBrl),
      subtitle: `Líquido: ${formatPct(takeRate)} do bruto`,
      icon: Activity,
      color: 'text-chart-5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div 
            key={i} 
            className="group bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card hover:shadow-hover hover:bg-bg-card-hover transition-all duration-200 flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-regular text-text-secondary">{c.title}</h3>
              <Icon className={`w-5 h-5 ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary leading-none mb-2">{c.value}</p>
              <p className="text-xs text-text-tertiary">{c.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
