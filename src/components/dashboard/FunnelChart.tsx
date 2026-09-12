"use client";

import { useFunnelMetrics } from '@/hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function FunnelChart() {
  const { data, isLoading } = useFunnelMetrics();

  if (isLoading) return <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />;

  const chartData = data?.funnel || [];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any, name: string) => [name === 'count' ? value : `R$ ${Number(value).toFixed(2)}`, name === 'count' ? 'Buyers' : 'Revenue']}
            />
            <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
