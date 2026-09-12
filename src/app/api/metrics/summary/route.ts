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

    // ── 1. Faturamento e contagem — apenas aprovados ──────────────────────
    const approvedAgg = await prisma.sale.aggregate({
      where: { status: 'APPROVED', ...dateWhere },
      _sum:   { grossBrl: true, netBrl: true },
      _count: { id: true },
    });

    const totalApproved   = approvedAgg._count.id;
    const grossRevenueBrl = approvedAgg._sum.grossBrl ?? 0;
    const netRevenueBrl   = approvedAgg._sum.netBrl   ?? 0;

    // ── 2. Compradores únicos Front-End (por e-mail distinto) ─────────────
    // Equivalente ao COUNTUNIQUEIFS da planilha — evita inflar com recompras
    const uniqueBuyersResult = await prisma.sale.findMany({
      where: {
        status:      'APPROVED',
        funnelStage: 'FRONTEND',
        buyerEmail:  { not: null },
        ...dateWhere,
      },
      select:   { buyerEmail: true },
      distinct: ['buyerEmail'],
    });
    const uniqueBuyers = uniqueBuyersResult.length;

    // ── 3. Receita adicional do funil (Order Bump + Upsell) ───────────────
    // Equivalente ao B29 da planilha: SUM(E4:E6)
    const additionalAgg = await prisma.sale.aggregate({
      where: {
        status:     'APPROVED',
        funnelStage: { in: ['ORDER_BUMP', 'UPSELL', 'UPSELL_01', 'UPSELL_02', 'DOWNSELL'] },
        ...dateWhere,
      },
      _sum: { netBrl: true },
    });
    const additionalRevenueBrl = additionalAgg._sum.netBrl ?? 0;
    const additionalRevenueShare = netRevenueBrl > 0
      ? (additionalRevenueBrl / netRevenueBrl) * 100
      : 0;

    // ── 4. AOV — receita líquida total ÷ compradores únicos ───────────────
    // Mesma fórmula B32 da planilha: B27 / B31
    const aovBrl = uniqueBuyers > 0 ? netRevenueBrl / uniqueBuyers : 0;

    // ── 5. Take Rate — líquido / bruto ────────────────────────────────────
    const takeRate = grossRevenueBrl > 0
      ? (netRevenueBrl / grossRevenueBrl) * 100
      : 0;

    // ── 6. Taxa de Aprovação Geral ────────────────────────────────────────
    // Equivalente ao B37 da planilha: aprovados / todos os eventos no período
    const totalEventsCount = await prisma.sale.count({ where: dateWhere });
    const approvalRate = totalEventsCount > 0
      ? (totalApproved / totalEventsCount) * 100
      : 0;

    return NextResponse.json({
      metrics: {
        // Faturamento
        totalApproved,
        grossRevenueBrl,
        netRevenueBrl,
        // Compradores
        uniqueBuyers,
        // Ticket médio
        aovBrl,
        // Take Rate (Hotmart retém X%)
        takeRate,
        // Funil
        additionalRevenueBrl,
        additionalRevenueShare,
        // Aprovação
        approvalRate,
        totalEvents: totalEventsCount,
      }
    });
  } catch (error) {
    console.error('Summary metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
