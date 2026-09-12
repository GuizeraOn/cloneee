"use client";

import { useCardHealth } from '@/hooks/useMetrics';
import { CreditCard, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function CardHealth() {
  const { data, isLoading } = useCardHealth();

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />;

  const health = data?.cardHealth;
  if (!health) return null;

  const getDiagnosticColor = (diag: string) => {
    switch (diag) {
      case 'GOOD': return 'text-green-600 bg-green-50 border-green-200';
      case 'WARNING': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = (diag: string) => {
    switch (diag) {
      case 'GOOD': return <CheckCircle2 className="w-5 h-5 mr-2" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5 mr-2" />;
      case 'CRITICAL': return <XCircle className="w-5 h-5 mr-2" />;
      default: return <CreditCard className="w-5 h-5 mr-2" />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${getDiagnosticColor(health.diagnostic)}`}>
      <div className="flex items-center">
        {getIcon(health.diagnostic)}
        <div>
          <h4 className="font-semibold">Credit Card Health</h4>
          <p className="text-sm opacity-90">{health.diagnostic} • {health.approvalRate.toFixed(1)}% Approval Rate</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p>Approved: <strong>{health.approved}</strong></p>
        <p>Declined: <strong>{health.declined}</strong></p>
      </div>
    </div>
  );
}
