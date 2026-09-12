import { create } from 'zustand';

export type Preset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'all' | 'custom';

interface DateFilterState {
  preset: Preset;
  startDate?: string;
  endDate?: string;
  setFilter: (preset: Preset, startDate?: string, endDate?: string) => void;
}

export const useDateFilter = create<DateFilterState>((set) => ({
  preset: 'last30days', // Default to last 30 days
  setFilter: (preset, startDate, endDate) => set({ preset, startDate, endDate }),
}));
