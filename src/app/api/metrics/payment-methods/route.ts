import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveDateRange } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const dateFilter = resolveDateRange({ preset, startDate, endDate });

    const grouped = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'APPROVED',
        ...(Object.keys(dateFilter).length > 0 && { purchasedAt: dateFilter }),
      },
      _sum: {
        grossBrl: true,
      },
      _count: {
        id: true,
      }
    });

    const totalRevenue = grouped.reduce((sum, item) => sum + (item._sum.grossBrl || 0), 0);

    const mapped = grouped.map(item => ({
      method: item.paymentMethod,
      count: item._count.id,
      revenue: item._sum.grossBrl || 0,
      share: totalRevenue > 0 ? ((item._sum.grossBrl || 0) / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ paymentMethods: mapped });
  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
