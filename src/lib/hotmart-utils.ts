/**
 * Normalizes Hotmart status to a unified set.
 * Docs: APPROVED, BLOCKED, CANCELLED, CHARGEBACK, COMPLETE, EXPIRED,
 *       NO_FUNDS, OVERDUE, PARTIALLY_REFUNDED, PRE_ORDER, PRINTED_BILLET,
 *       PROCESSING_TRANSACTION, DISPUTE, REFUNDED, STARTED, UNDER_ANALISYS, WAITING_PAYMENT
 */
export function normalizeStatus(status: string): string {
  const s = status.toUpperCase();
  if (['APPROVED', 'COMPLETE', 'COMPLETED'].includes(s)) return 'APPROVED';
  if (['CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK', 'BLOCKED', 'DISPUTE', 'PROTESTED'].includes(s)) return 'REFUNDED';
  if (['PRINTED_BILLET', 'WAITING_PAYMENT', 'PROCESSING_TRANSACTION', 'STARTED', 'PRE_ORDER', 'UNDER_ANALISYS'].includes(s)) return 'PENDING';
  if (['OVERDUE', 'EXPIRED', 'NO_FUNDS'].includes(s)) return 'EXPIRED';
  return s;
}

/**
 * Normalizes payment method.
 * Docs: BILLET, CASH_PAYMENT, CREDIT_CARD, DIRECT_BANK_TRANSFER, DIRECT_DEBIT,
 *       FINANCED_BILLET, FINANCED_INSTALLMENT, GOOGLE_PAY, HOTCARD, HYBRID,
 *       MANUAL_TRANSFER, PAYPAL, PAYPAL_INTERNACIONAL, PICPAY, PIX, SAMSUNG_PAY, WALLET
 */
export function normalizePaymentMethod(method: string): string {
  const m = method.toUpperCase();
  if (m === 'CREDIT_CARD') return 'CREDIT_CARD';
  if (m === 'PIX') return 'PIX';
  if (m === 'BILLET' || m === 'FINANCED_BILLET') return 'BOLETO';
  if (m === 'FINANCED_INSTALLMENT') return 'CREDIT_CARD'; // parcelado = cartão
  if (['PAYPAL', 'PAYPAL_INTERNACIONAL'].includes(m)) return 'PAYPAL';
  if (m === 'PICPAY') return 'PICPAY';
  if (m === 'GOOGLE_PAY' || m === 'SAMSUNG_PAY') return 'DIGITAL_WALLET';
  return m;
}

/**
 * Resolves funnel stage using the official Hotmart fields:
 * - purchase.order_bump.is_order_bump → ORDER_BUMP (campo nativo)
 * - purchase.is_funnel + product name heuristic → UPSELL / DOWNSELL
 * - Fallback → FRONTEND
 */
export function resolveFunnelStage(
  isOrderBump: boolean,
  isFunnel: boolean,
  productName: string
): string {
  // Prioridade 1: campo nativo da API
  if (isOrderBump) return 'ORDER_BUMP';

  const name = productName.toLowerCase();

  // Prioridade 2 (planilha): "upsell 02", "upsell 2" ou "mentoria" → Upsell 02
  if (
    name.includes('upsell 02') ||
    name.includes('upsell 2')  ||
    name.includes('upsell2')   ||
    name.includes('mentoria')
  ) return 'UPSELL_02';

  // Prioridade 3 (planilha): "upsell 01", "upsell 1" ou "acelerador" → Upsell 01
  if (
    name.includes('upsell 01') ||
    name.includes('upsell 1')  ||
    name.includes('upsell1')   ||
    name.includes('acelerador')
  ) return 'UPSELL_01';

  // Se is_funnel=true mas sem identificador específico → assume Upsell 01
  if (isFunnel) return 'UPSELL_01';

  // Downsell genérico
  if (name.includes('downsell') || name.includes('down sell')) return 'DOWNSELL';

  // Padrão: produto principal (Front-End)
  return 'FRONTEND';
}

/**
 * Extracts origin/tracking params from purchase.origin.
 * Docs fields: src, sck, xcod
 */
export function extractOrigin(origin: Record<string, string> | null | undefined): Record<string, string> {
  return {
    src: origin?.src ?? '',
    sck: origin?.sck ?? '',
    xcod: origin?.xcod ?? '',
  };
}

/**
 * Finds the PRODUCER commission value (our net revenue) from the commissions array.
 * The PRODUCER entry holds the actual payout to us.
 */
export function extractProducerCommission(
  commissions: Array<{ value: number; currency_value: string; source: string; currency_conversion?: { converted_value: number; converted_to_currency: string; conversion_rate: number } }>
): { valueUsd: number; valueBrl: number; conversionRate: number } {
  const producer = commissions?.find(c => c.source === 'PRODUCER');
  if (!producer) return { valueUsd: 0, valueBrl: 0, conversionRate: 0 };

  const valueUsd = producer.value ?? 0;
  const converted = producer.currency_conversion;
  
  if (converted && converted.converted_to_currency === 'BRL') {
    return {
      valueUsd,
      valueBrl: converted.converted_value,
      conversionRate: converted.conversion_rate,
    };
  }

  return { valueUsd, valueBrl: 0, conversionRate: 0 };
}
