"use client";

import { useDateFilter, Preset } from '@/store/useDateFilter';
import { CalendarIcon } from 'lucide-react';

export function DateFilter() {
  const { preset, setFilter } = useDateFilter();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value as Preset);
  };

  return (
    <div className="flex items-center space-x-2 bg-bg-input border border-border-default rounded-sm px-3 py-1.5 w-48 shadow-sm">
      <CalendarIcon className="w-4 h-4 text-text-secondary" />
      <select
        value={preset}
        onChange={handleSelectChange}
        className="w-full text-sm border-none focus:ring-0 bg-transparent outline-none cursor-pointer text-text-primary"
      >
        <option value="today" className="bg-bg-surface text-text-primary">Hoje</option>
        <option value="yesterday" className="bg-bg-surface text-text-primary">Ontem</option>
        <option value="last7days" className="bg-bg-surface text-text-primary">Últimos 7 dias</option>
        <option value="last30days" className="bg-bg-surface text-text-primary">Últimos 30 dias</option>
        <option value="thisMonth" className="bg-bg-surface text-text-primary">Este Mês</option>
        <option value="all" className="bg-bg-surface text-text-primary">Máximo (Tudo)</option>
      </select>
    </div>
  );
}
