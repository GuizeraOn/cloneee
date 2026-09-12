"use client";

import { useState } from 'react';
import { useSalesList } from '@/hooks/useMetrics';

export function SalesTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useSalesList(page, limit);

  if (isLoading) return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;

  const sales = data?.sales || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Stage</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Net (BRL)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s: any) => (
              <tr key={s.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{new Date(s.purchasedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute:'2-digit' })}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{s.productName}</td>
                <td className="px-6 py-4">{s.funnelStage}</td>
                <td className="px-6 py-4">{s.paymentMethod}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">R$ {s.netBrl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
