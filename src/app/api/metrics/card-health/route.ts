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
      by: ['status'],
      where: {
        paymentMethod: 'CREDIT_CARD',
        ...(Object.keys(dateFilter).length > 0 && { purchasedAt: dateFilter }),
      },
      _count: {
        id: true,
      }
    });

    const counts = grouped.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const approved = counts['APPROVED'] || 0;
    const declined = (counts['REFUNDED'] || 0) + (counts['DECLINED'] || 0) + (counts['CHARGEBACK'] || 0);
    const total = approved + declined;

    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    
    let diagnostic = 'GOOD';
    if (approvalRate < 70) diagnostic = 'WARNING';
    if (approvalRate < 50) diagnostic = 'CRITICAL';
    if (total === 0) diagnostic = 'NO_DATA';

    return NextResponse.json({
      cardHealth: {
        approved,
        declined,
        total,
        approvalRate,
        diagnostic
      }
    });
  } catch (error) {
    console.error('Card health error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
