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
    const dateWhere = Object.keys(dateFilter).length > 0 ? { purchasedAt: dateFilter } : {};

    // Métricas do Cartão
    const grouped = await prisma.sale.groupBy({
      by: ['status'],
      where: {
        paymentMethod: 'CREDIT_CARD',
        ...dateWhere,
      },
      _count: { id: true },
      _sum: { netBrl: true, grossBrl: true }
    });

    // Receita Total Global (para calcular a %)
    const globalAgg = await prisma.sale.aggregate({
      where: { status: 'APPROVED', ...dateWhere },
      _sum: { netBrl: true }
    });
    const globalNet = globalAgg._sum.netBrl ?? 0;

    let approved = 0;
    let declined = 0;
    let netBrl = 0;
    let grossBrl = 0;

    for (const row of grouped) {
      if (row.status === 'APPROVED') {
        approved += row._count.id;
        netBrl += row._sum.netBrl ?? 0;
        grossBrl += row._sum.grossBrl ?? 0;
      } else if (['REFUNDED', 'CANCELED', 'CHARGEBACK', 'DECLINED'].includes(row.status)) {
        declined += row._count.id;
      }
    }

    const total = approved + declined;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const aov = approved > 0 ? netBrl / approved : 0;
    const share = globalNet > 0 ? (netBrl / globalNet) * 100 : 0;
    
    let diagnostic = 'GOOD';
    if (approvalRate > 0 && approvalRate < 75) diagnostic = 'WARNING';
    if (approvalRate > 0 && approvalRate < 60) diagnostic = 'CRITICAL';
    if (total === 0) diagnostic = 'NO_DATA';

    return NextResponse.json({
      cardHealth: {
        approved,
        declined,
        total,
        approvalRate,
        netBrl,
        grossBrl,
        aov,
        share,
        diagnostic
      }
    });
  } catch (error) {
    console.error('Card health error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
