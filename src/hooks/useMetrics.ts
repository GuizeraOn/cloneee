import { useQuery } from '@tanstack/react-query';
import { useDateFilter } from '@/store/useDateFilter';

function useFilterParams() {
  const { preset, startDate, endDate } = useDateFilter();
  const params = new URLSearchParams();
  if (preset) params.append('preset', preset);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  return params.toString();
}

export function useSummaryMetrics() {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['summaryMetrics', filterString],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/summary?${filterString}`);
      if (!res.ok) throw new Error('Failed to fetch summary metrics');
      return res.json();
    }
  });
}

export function useFunnelMetrics() {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['funnelMetrics', filterString],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/funnel?${filterString}`);
      if (!res.ok) throw new Error('Failed to fetch funnel metrics');
      return res.json();
    }
  });
}

export function usePaymentMethods() {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['paymentMethods', filterString],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/payment-methods?${filterString}`);
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    }
  });
}

export function useCardHealth() {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['cardHealth', filterString],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/card-health?${filterString}`);
      if (!res.ok) throw new Error('Failed to fetch card health');
      return res.json();
    }
  });
}

export function useSalesList(page: number, limit: number) {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['salesList', filterString, page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/sales?${filterString}&page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch sales');
      return res.json();
    }
  });
}

export function useGeoMetrics() {
  const filterString = useFilterParams();
  return useQuery({
    queryKey: ['geoMetrics', filterString],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/geo?${filterString}`);
      if (!res.ok) throw new Error('Failed to fetch geo metrics');
      return res.json();
    }
  });
}
