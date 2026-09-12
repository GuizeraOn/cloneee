import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveDateRange } from '@/lib/date-utils';

// Ordem canônica do funil — igual à planilha
const FUNNEL_ORDER = ['FRONTEND', 'ORDER_BUMP', 'UPSELL_01', 'UPSELL_02', 'DOWNSELL'];
const FUNNEL_LABELS: Record<string, string> = {
  FRONTEND:   'Front-End',
  ORDER_BUMP: 'Order Bump',
  UPSELL_01:  'Upsell 01',
  UPSELL_02:  'Upsell 02',
  DOWNSELL:   'Downsell',
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const preset    = searchParams.get('preset')    || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate   = searchParams.get('endDate')   || undefined;

    const dateFilter = resolveDateRange({ preset, startDate, endDate });
    const dateWhere  = Object.keys(dateFilter).length > 0 ? { purchasedAt: dateFilter } : {};

    // Agrupa por funnelStage — todos os eventos (para taxa de aprovação por etapa)
    const allGrouped = await prisma.sale.groupBy({
      by: ['funnelStage'],
      where: dateWhere,
      _count: { id: true },
    });

    // Apenas aprovados — para faturamento e Take Rate
    const approvedGrouped = await prisma.sale.groupBy({
      by: ['funnelStage'],
      where: { status: 'APPROVED', ...dateWhere },
      _sum:   { grossBrl: true, netBrl: true },
      _count: { id: true },
    });

    // Constrói mapa de aprovados indexado por etapa
    const approvedMap: Record<string, { count: number; gross: number; net: number }> = {};
    for (const row of approvedGrouped) {
      approvedMap[row.funnelStage] = {
        count: row._count.id,
        gross: row._sum.grossBrl ?? 0,
        net:   row._sum.netBrl   ?? 0,
      };
    }

    // Total de eventos por etapa (aprovados + não aprovados)
    const totalMap: Record<string, number> = {};
    for (const row of allGrouped) {
      totalMap[row.funnelStage] = row._count.id;
    }

    // Compradores únicos no Front-End (base de cálculo para Take Rates)
    const frontendUniqueResult = await prisma.sale.findMany({
      where: { status: 'APPROVED', funnelStage: 'FRONTEND', buyerEmail: { not: null }, ...dateWhere },
      select:   { buyerEmail: true },
      distinct: ['buyerEmail'],
    });
    const frontendUnique = frontendUniqueResult.length;
    const frontendApproved = approvedMap['FRONTEND']?.count ?? 0;

    // Monta resposta na ordem canônica do funil
    const funnel = FUNNEL_ORDER
      .filter(stage => approvedMap[stage] || totalMap[stage]) // exclui etapas sem dados
      .map(stage => {
        const approved = approvedMap[stage] ?? { count: 0, gross: 0, net: 0 };
        const totalEvents = totalMap[stage] ?? 0;

        // Take Rate = aprovados nesta etapa / compradores únicos Front-End
        // (equivalente às células B33, B34, B35, B36 da planilha)
        const takeRateFromFrontend = frontendUnique > 0 && stage !== 'FRONTEND'
          ? (approved.count / frontendUnique) * 100
          : null;

        // Avanço Upsell 1 → Upsell 2 (B35 da planilha)
        const takeRateFromUpsell01 = stage === 'UPSELL_02' && (approvedMap['UPSELL_01']?.count ?? 0) > 0
          ? (approved.count / approvedMap['UPSELL_01'].count) * 100
          : null;

        return {
          stage,
          label: FUNNEL_LABELS[stage] ?? stage,
          totalEvents,
          approvedCount:       approved.count,
          grossBrl:            approved.gross,
          netBrl:              approved.net,
          takeRateFromFrontend,
          takeRateFromUpsell01,
        };
      });

    return NextResponse.json({
      funnel,
      frontendUnique,
      frontendApproved,
    });
  } catch (error) {
    console.error('Funnel metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
