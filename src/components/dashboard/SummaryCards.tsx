"use client";

import { useSummaryMetrics } from '@/hooks/useMetrics';
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react';

export function SummaryCards() {
  const { data, isLoading, error } = useSummaryMetrics();

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
  </div>;

  if (error || !data) return <div className="p-4 text-red-500 bg-red-50 rounded-xl">Error loading metrics</div>;

  const { totalSales, grossRevenueBrl, netRevenueBrl, aovBrl, takeRate } = data.metrics;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const cards = [
    { title: 'Gross Revenue', value: formatCurrency(grossRevenueBrl), icon: DollarSign, color: 'text-blue-600' },
    { title: 'Net Revenue', value: formatCurrency(netRevenueBrl), icon: Activity, color: 'text-green-600' },
    { title: 'Total Buyers', value: totalSales.toLocaleString(), icon: Users, color: 'text-purple-600' },
    { title: 'AOV / Take Rate', value: `${formatCurrency(aovBrl)} / ${takeRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">{c.title}</h3>
              <div className={`p-2 bg-gray-50 rounded-lg ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        )
      })}
    </div>
  );
}
