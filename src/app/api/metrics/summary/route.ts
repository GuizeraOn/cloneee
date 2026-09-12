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

    const aggregate = await prisma.sale.aggregate({
      where: {
        status: 'APPROVED',
        ...(Object.keys(dateFilter).length > 0 && { purchasedAt: dateFilter }),
      },
      _sum: {
        grossBrl: true,
        netBrl: true,
        grossUsd: true,
      },
      _count: {
        id: true,
      }
    });

    const totalSales = aggregate._count.id;
    const grossRevenueBrl = aggregate._sum.grossBrl || 0;
    const netRevenueBrl = aggregate._sum.netBrl || 0;
    
    // AOV (Average Order Value)
    const aovBrl = totalSales > 0 ? grossRevenueBrl / totalSales : 0;
    
    // Simplistic uplift calculation (e.g., net / gross)
    const takeRate = grossRevenueBrl > 0 ? (netRevenueBrl / grossRevenueBrl) * 100 : 0;

    return NextResponse.json({
      metrics: {
        totalSales,
        grossRevenueBrl,
        netRevenueBrl,
        aovBrl,
        takeRate
      }
    });
  } catch (error) {
    console.error('Summary metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
