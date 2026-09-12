import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchLatestUsdBrlRate } from '@/lib/exchange-rate';
import { resolveFunnelStage, normalizePaymentMethod, normalizeStatus, extractProducerCommission } from '@/lib/hotmart-utils';

export async function POST(req: NextRequest) {
  try {
    // Nota: O HOTTOK foi removido da interface da Hotmart em contas mais recentes.
    // Caso sua conta tenha, defina HOTMART_HOTTOK no .env e descomente o bloco abaixo.
    //
    // const hottok = req.headers.get('x-hotmart-hottok');
    // const EXPECTED_HOTTOK = process.env.HOTMART_HOTTOK;
    // if (EXPECTED_HOTTOK && hottok !== EXPECTED_HOTTOK) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const payload = await req.json();

    // 2. Validar estrutura — conforme documentação 2.0
    // Campos raiz: id, creation_date, event, version, data
    const purchase = payload?.data?.purchase;
    const transactionId = purchase?.transaction;

    if (!transactionId) {
      console.warn('Webhook rejected: missing purchase.transaction');
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    // 3. Extrair campos conforme documentação oficial
    const productName = payload?.data?.product?.name ?? 'Unknown Product';
    const rawStatus   = purchase?.status ?? 'UNKNOWN';
    const status      = normalizeStatus(rawStatus);
    const paymentType = purchase?.payment?.type ?? 'UNKNOWN';
    const paymentMethod = normalizePaymentMethod(paymentType);

    // Funnel Stage — usando campos nativos da API:
    // purchase.order_bump.is_order_bump → ORDER_BUMP
    // purchase.is_funnel → dentro do funil (Upsell/Downsell por nome)
    const isOrderBump = purchase?.order_bump?.is_order_bump === true;
    const isFunnel    = purchase?.is_funnel === true;
    const funnelStage = resolveFunnelStage(isOrderBump, isFunnel, productName);

    // 4. Calcular valores financeiros
    // Gross = purchase.full_price (o que o comprador pagou)
    // Net   = comissão do PRODUCER (o que nós recebemos)
    const fullPrice = purchase?.full_price;
    const grossUsd  = fullPrice?.currency_value === 'USD' ? (fullPrice?.value ?? 0) : 0;

    // Comissões — campo correto: data.commissions[]
    const commissions = payload?.data?.commissions ?? [];
    const { valueUsd: netUsd, valueBrl: netBrlFromHotmart, conversionRate: hotmartRate } = extractProducerCommission(commissions);

    // Cotação: preferir a taxa que a Hotmart já nos enviou na currency_conversion,
    // senão buscamos via AwesomeAPI (nosso cron de fallback)
    const exchangeRate = hotmartRate > 0 ? hotmartRate : await fetchLatestUsdBrlRate();
    const grossBrl     = grossUsd * exchangeRate;
    const netBrl       = netBrlFromHotmart > 0 ? netBrlFromHotmart : netUsd * exchangeRate;

    // Data de aprovação (purchase.approved_date em milissegundos)
    const purchasedAt = purchase?.approved_date
      ? new Date(purchase.approved_date)
      : new Date(payload?.creation_date ?? Date.now());

    // 5. Inserir no banco com deduplicação nativa pelo transactionId (UNIQUE)
    try {
      await prisma.sale.create({
        data: {
          transactionId: String(transactionId),
          purchasedAt,
          productName,
          funnelStage,
          paymentMethod,
          status,
          grossUsd,
          netUsd,
          exchangeRate,
          grossBrl,
          netBrl,
          rawPayload: payload,
        }
      });
    } catch (dbError: any) {
      // P2002 = Unique constraint violation → transação já processada (deduplicação)
      if (dbError.code === 'P2002') {
        console.log(`[Webhook] Deduplicado: transaction ${transactionId} já existe.`);
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 });
      }
      throw dbError;
    }

    console.log(`[Webhook] Venda processada: ${transactionId} | ${status} | R$ ${netBrl.toFixed(2)}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] Erro inesperado:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
