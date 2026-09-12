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
      by: ['funnelStage'],
      where: {
        status: 'APPROVED',
        ...(Object.keys(dateFilter).length > 0 && { purchasedAt: dateFilter }),
      },
      _sum: {
        grossBrl: true,
        netBrl: true,
      },
      _count: {
        id: true,
      }
    });

    // Calculate advance rates / take rates from frontend to upsell
    const funnelMap = grouped.reduce((acc, curr) => {
      acc[curr.funnelStage] = {
        count: curr._count.id,
        gross: curr._sum.grossBrl || 0,
        net: curr._sum.netBrl || 0
      };
      return acc;
    }, {} as Record<string, { count: number, gross: number, net: number }>);

    const frontendCount = funnelMap['FRONTEND']?.count || 0;
    
    // Add conversion rates
    const funnelWithRates = Object.entries(funnelMap).map(([stage, metrics]) => {
      const conversionFromFrontend = frontendCount > 0 && stage !== 'FRONTEND' 
        ? (metrics.count / frontendCount) * 100 
        : null;
      
      return {
        stage,
        ...metrics,
        conversionFromFrontend
      };
    });

    return NextResponse.json({ funnel: funnelWithRates });
  } catch (error) {
    console.error('Funnel metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
