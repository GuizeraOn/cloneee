"use client";

import { useCardHealth } from '@/hooks/useMetrics';
import { CreditCard, AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function CardHealth() {
  const { data, isLoading } = useCardHealth();

  if (isLoading) return <div className="h-80 bg-bg-card rounded-xl border border-border-subtle animate-pulse" />;

  const health = data?.cardHealth;
  if (!health) return null;

  const getDiagnosticStyle = (diag: string) => {
    switch (diag) {
      case 'GOOD': return 'text-success bg-success-bg border-success';
      case 'WARNING': return 'text-warning bg-[#2A2300] border-warning';
      case 'CRITICAL': return 'text-danger bg-danger-bg border-danger';
      default: return 'text-text-secondary bg-bg-surface border-border-subtle';
    }
  };

  const getIcon = (diag: string) => {
    switch (diag) {
      case 'GOOD': return <CheckCircle2 className="w-5 h-5" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5" />;
      case 'CRITICAL': return <XCircle className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getDiagnosticText = () => {
    if (health.total === 0) return 'Aguardando dados de cartão.';
    if (health.approvalRate >= 80) return 'A taxa de aprovação está saudável e acima da média do mercado.';
    if (health.approvalRate >= 60) return 'A taxa de aprovação exige atenção. Muitas vendas sendo recusadas.';
    return 'Alerta Crítico: Mais da metade das vendas no cartão estão sendo recusadas!';
  };

  return (
    <div className="bg-bg-card p-6 rounded-xl border border-border-subtle shadow-card hover:shadow-hover transition-all duration-200 flex flex-col justify-between">
      <div className="mb-4 pb-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Saúde do Cartão</h3>
          <p className="text-sm text-text-secondary mt-1">Diagnóstico de aprovação e recusa</p>
        </div>
        <div className={`p-2 rounded-lg flex items-center gap-2 border ${getDiagnosticStyle(health.diagnostic)}`}>
          {getIcon(health.diagnostic)}
          <span className="font-bold">{health.approvalRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <p className="text-xs text-text-secondary mb-1">Aprovadas</p>
          <p className="text-xl font-bold text-success">{health.approved} <span className="text-sm text-text-tertiary font-normal">de {health.total}</span></p>
        </div>
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <p className="text-xs text-text-secondary mb-1">Recusadas</p>
          <p className="text-xl font-bold text-danger">{health.declined}</p>
        </div>
        
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <p className="text-xs text-text-secondary mb-1">Ticket Médio (Cartão)</p>
          <p className="text-lg font-bold text-text-primary">{formatCurrency(health.aov)}</p>
        </div>
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <p className="text-xs text-text-secondary mb-1">Participação na Receita</p>
          <p className="text-lg font-bold text-info">{health.share.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-auto bg-bg-surface p-4 rounded-lg border border-border-subtle border-l-4 border-l-info">
        <p className="text-sm text-text-secondary italic">
          "{getDiagnosticText()}"
        </p>
      </div>
    </div>
  );
}
