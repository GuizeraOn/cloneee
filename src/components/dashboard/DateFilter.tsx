"use client";

import { useDateFilter, Preset } from '@/store/useDateFilter';
import { CalendarIcon } from 'lucide-react';

export function DateFilter() {
  const { preset, setFilter } = useDateFilter();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value as Preset);
  };

  return (
    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md shadow-sm px-3 py-2">
      <CalendarIcon className="w-4 h-4 text-gray-500" />
      <select
        value={preset}
        onChange={handleSelectChange}
        className="text-sm border-none focus:ring-0 bg-transparent outline-none cursor-pointer text-gray-700"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="thisMonth">This Month</option>
        <option value="all">All Time</option>
      </select>
    </div>
  );
}
