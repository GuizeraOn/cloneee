export interface DateFilterParams {
  preset?: string;
  startDate?: string;
  endDate?: string;
}

export interface PrismaDateFilter {
  gte?: Date;
  lte?: Date;
}

export function resolveDateRange(params: DateFilterParams): PrismaDateFilter {
  const { preset, startDate, endDate } = params;
  
  if (startDate && endDate) {
    return {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { gte: today, lte: now };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { gte: yesterday, lte: new Date(today.getTime() - 1) };
    case 'last7days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { gte: last7, lte: now };
    case 'last30days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { gte: last30, lte: now };
    case 'thisMonth':
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { gte: firstDay, lte: now };
    case 'all':
    default:
      return {};
  }
}
