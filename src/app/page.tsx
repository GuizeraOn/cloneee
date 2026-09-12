import { DateFilter } from '@/components/dashboard/DateFilter';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { PaymentMethodsChart } from '@/components/dashboard/PaymentMethodsChart';
import { GeoChart } from '@/components/dashboard/GeoChart';
import { CardHealth } from '@/components/dashboard/CardHealth';
import { SalesTable } from '@/components/dashboard/SalesTable';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Real-time metrics from Hotmart</p>
          </div>
          <DateFilter />
        </header>

        {/* Big Numbers */}
        <SummaryCards />

        {/* Diagnostic */}
        <CardHealth />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <FunnelChart />
          <PaymentMethodsChart />
          <GeoChart />
        </div>

        {/* Table */}
        <SalesTable />

      </div>
    </main>
  );
}
