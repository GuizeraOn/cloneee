"use client";

import { useState } from 'react';
import { useSalesList } from '@/hooks/useMetrics';

export function SalesTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useSalesList(page, limit);

  if (isLoading) return <div className="h-96 bg-bg-card rounded-xl border border-border-subtle animate-pulse" />;

  const sales = data?.sales || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle shadow-card overflow-hidden mt-8">
      <div className="p-6 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary">Transações Recentes</h3>
        <p className="text-sm text-text-secondary mt-1">Últimas vendas registradas pelo Webhook</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-tertiary uppercase bg-bg-surface border-b border-border-default">
            <tr>
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Produto</th>
              <th className="px-6 py-4 font-semibold">Etapa (Funil)</th>
              <th className="px-6 py-4 font-semibold">Método</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Líquido (BRL)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s: any) => (
              <tr key={s.id} className="bg-bg-card border-b border-border-subtle hover:bg-bg-surface transition-colors">
                <td className="px-6 py-4">{new Date(s.purchasedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                <td className="px-6 py-4 font-medium text-text-primary">{s.productName}</td>
                <td className="px-6 py-4">
                  <span className="bg-bg-input px-2 py-1 rounded text-xs text-text-secondary">
                    {s.funnelStage}
                  </span>
                </td>
                <td className="px-6 py-4">{s.paymentMethod}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${s.status === 'APPROVED' ? 'bg-success-bg text-success border border-success/20' : 'bg-bg-input text-text-secondary border border-border-default'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.netBrl)}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-tertiary">
                  Nenhuma transação encontrada neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 0 && (
        <div className="p-4 flex items-center justify-between border-t border-border-subtle bg-bg-surface/50">
          <span className="text-sm text-text-secondary">
            Página <strong className="text-text-primary">{pagination.page}</strong> de <strong className="text-text-primary">{pagination.totalPages}</strong>
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border-default rounded-md bg-bg-card hover:bg-bg-card-hover text-text-primary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 border border-border-default rounded-md bg-bg-card hover:bg-bg-card-hover text-text-primary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
