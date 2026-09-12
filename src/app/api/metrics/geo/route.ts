import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveDateRange } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const preset    = searchParams.get('preset')    || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate   = searchParams.get('endDate')   || undefined;

    const dateFilter = resolveDateRange({ preset, startDate, endDate });
    const dateWhere  = Object.keys(dateFilter).length > 0 ? { purchasedAt: dateFilter } : {};

    // Agrupa receita líquida e contagem por país — apenas aprovados
    const grouped = await prisma.sale.groupBy({
      by: ['country'],
      where: {
        status:  'APPROVED',
        country: { not: null },
        ...dateWhere,
      },
      _sum:   { netBrl: true },
      _count: { id: true },
      orderBy: { _sum: { netBrl: 'desc' } },
    });

    const totalRevenue = grouped.reduce((sum, g) => sum + (g._sum.netBrl ?? 0), 0);

    const geo = grouped.map(g => ({
      country: g.country ?? 'Desconhecido',
      count:   g._count.id,
      revenue: g._sum.netBrl ?? 0,
      share:   totalRevenue > 0 ? ((g._sum.netBrl ?? 0) / totalRevenue) * 100 : 0,
    }));

    return NextResponse.json({ geo, totalRevenue });
  } catch (error) {
    console.error('Geo metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
