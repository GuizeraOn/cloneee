import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchLatestUsdBrlRate } from '@/lib/exchange-rate';
import { resolveFunnelStage, normalizePaymentMethod, normalizeStatus } from '@/lib/hotmart-utils';

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

    // Validar estrutura — campos raiz: id, creation_date, event, version, data
    const purchase = payload?.data?.purchase;
    const transactionId = purchase?.transaction;

    if (!transactionId) {
      console.warn('Webhook rejected: missing purchase.transaction');
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    // Extrair campos conforme documentação 2.0
    const productName = payload?.data?.product?.name ?? 'Unknown Product';
    const rawStatus   = purchase?.status ?? 'UNKNOWN';
    const status      = normalizeStatus(rawStatus);
    const paymentType = purchase?.payment?.type ?? 'UNKNOWN';
    const paymentMethod = normalizePaymentMethod(paymentType);

    // Funnel Stage via campos nativos
    const isOrderBump = purchase?.order_bump?.is_order_bump === true;
    const isFunnel    = purchase?.is_funnel === true;
    const funnelStage = resolveFunnelStage(isOrderBump, isFunnel, productName);

    // ─── VALORES FINANCEIROS ───────────────────────────────────────────────
    // Bug fix: A Hotmart pode enviar preços em BRL ou USD dependendo do produto.
    // Precisamos normalizar tudo para BRL e guardar o USD quando disponível.
    const fullPrice         = purchase?.full_price;
    const fullPriceCurrency = fullPrice?.currency_value ?? 'BRL';
    const fullPriceValue    = Number(fullPrice?.value ?? 0);

    // Comissão do PRODUCER = nosso líquido
    const commissions    = payload?.data?.commissions ?? [];
    const producerEntry  = commissions.find((c: any) => c.source === 'PRODUCER');
    const producerValue  = Number(producerEntry?.value ?? 0);
    const producerCurrency = producerEntry?.currency_value ?? 'BRL';

    // Taxa de câmbio
    // 1. Preferir conversion_rate que a Hotmart envia no payload
    const hotmartRate = Number(producerEntry?.currency_conversion?.conversion_rate ?? 0);
    const exchangeRate = hotmartRate > 0 ? hotmartRate : await fetchLatestUsdBrlRate();

    let grossUsd: number;
    let grossBrl: number;
    let netUsd: number;
    let netBrl: number;

    if (fullPriceCurrency === 'USD') {
      // Produto vendido em dólar (exportação)
      grossUsd = fullPriceValue;
      grossBrl = fullPriceValue * exchangeRate;
      netUsd   = producerCurrency === 'USD' ? producerValue : producerValue / exchangeRate;
      netBrl   = producerCurrency === 'BRL' ? producerValue : producerValue * exchangeRate;
    } else {
      // Produto vendido em BRL (Brasil) — caso do payload de teste
      grossBrl = fullPriceValue;
      grossUsd = exchangeRate > 0 ? fullPriceValue / exchangeRate : 0;
      netBrl   = producerCurrency === 'BRL' ? producerValue : producerValue * exchangeRate;
      netUsd   = exchangeRate > 0 ? netBrl / exchangeRate : 0;
    }
    // ────────────────────────────────────────────────────────────────────────

    // Data de aprovação (preferred) ou criação do evento
    const purchasedAt = purchase?.approved_date
      ? new Date(Number(purchase.approved_date))
      : new Date(Number(payload?.creation_date ?? Date.now()));

    // Dados do comprador e origem
    const buyerEmail = payload?.data?.buyer?.email ?? null;
    const buyerName  = payload?.data?.buyer?.name ?? null;
    const country    = purchase?.checkout_country?.name ?? payload?.data?.buyer?.address?.country ?? null;
    const utmSource  = purchase?.origin?.src ?? purchase?.origin?.sck ?? null;

    // Inserir com deduplicação nativa (UNIQUE constraint em transactionId)
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
          buyerEmail,
          buyerName,
          country,
          utmSource,
          rawPayload: payload,
        }
      });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        console.log(`[Webhook] Deduplicado: ${transactionId} já existe.`);
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 });
      }
      throw dbError;
    }

    console.log(`[Webhook] ✅ ${transactionId} | ${status} | R$ ${netBrl.toFixed(2)}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] Erro inesperado:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
