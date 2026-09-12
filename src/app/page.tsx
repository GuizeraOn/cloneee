import { DateFilter } from '@/components/dashboard/DateFilter';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { PaymentMethodsChart } from '@/components/dashboard/PaymentMethodsChart';
import { GeoChart } from '@/components/dashboard/GeoChart';
import { CardHealth } from '@/components/dashboard/CardHealth';
import { SalesTable } from '@/components/dashboard/SalesTable';
import { LayoutDashboard, BarChart3, Settings } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      {/* Sidebar (Collapsed 72px) */}
      <aside className="hidden md:flex flex-col items-center w-[72px] bg-bg-surface border-r border-border-subtle py-6 gap-8">
        <div className="w-10 h-10 bg-info rounded-full flex items-center justify-center font-bold text-lg text-white shadow-glow">
          DM
        </div>
        <nav className="flex flex-col gap-4 flex-1">
          <button className="w-11 h-11 rounded-lg bg-bg-card-hover border-l-4 border-info flex items-center justify-center text-info shadow-card">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button className="w-11 h-11 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-card flex items-center justify-center transition-colors">
            <BarChart3 className="w-5 h-5" />
          </button>
        </nav>
        <div className="flex flex-col gap-4">
          <button className="w-11 h-11 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-card flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header 64px */}
        <header className="h-[64px] shrink-0 border-b border-border-subtle flex items-center justify-between px-6 lg:px-12 bg-bg-surface">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Dashboard Financeiro</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-bg-card border border-border-default flex items-center justify-center text-xs font-bold">
                Admin
             </div>
          </div>
        </header>

        {/* Filter Bar 56px */}
        <div className="h-[56px] shrink-0 border-b border-border-subtle flex items-center px-6 lg:px-12 bg-bg-base">
          <DateFilter />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 lg:px-12 lg:py-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto space-y-8">
            
            {/* KPI GRID (4 columns desktop, 2 tablet, 1 mobile) */}
            <SummaryCards />

            {/* CHART GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FunnelChart />
              <GeoChart />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CardHealth />
              <PaymentMethodsChart />
            </div>

            {/* Table */}
            <SalesTable />
          </div>
        </div>
      </main>
    </div>
  );
}
