/**
 * Normalizes Hotmart status to a unified set of statuses.
 */
export function normalizeStatus(status: string): string {
  const s = status.toUpperCase();
  if (['APPROVED', 'COMPLETE'].includes(s)) return 'APPROVED';
  if (['CANCELED', 'REFUNDED', 'CHARGEBACK'].includes(s)) return 'REFUNDED';
  if (['BILLET_PRINTED', 'WAITING_PAYMENT'].includes(s)) return 'PENDING';
  return s;
}

/**
 * Normalizes payment method.
 */
export function normalizePaymentMethod(method: string): string {
  const m = method.toUpperCase();
  if (m.includes('CREDIT_CARD')) return 'CREDIT_CARD';
  if (m.includes('PIX')) return 'PIX';
  if (m.includes('BILLET')) return 'BOLETO';
  return m;
}

/**
 * Normalizes the funnel stage if present in the product name or tags.
 */
export function normalizeFunnelStage(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes('upsell') || name.includes('up sell')) return 'UPSELL';
  if (name.includes('downsell') || name.includes('down sell')) return 'DOWNSELL';
  if (name.includes('orderbump') || name.includes('order bump')) return 'ORDER_BUMP';
  return 'FRONTEND';
}

/**
 * Extracts UTM parameters from a tracking string or object.
 */
export function extractUtm(trackingStr: string | null | undefined): Record<string, string> {
  const utms: Record<string, string> = { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' };
  if (!trackingStr) return utms;
  
  // Try parsing as query string
  try {
    const urlParams = new URLSearchParams(trackingStr);
    for (const key of Object.keys(utms)) {
      if (urlParams.has(key)) {
        utms[key] = urlParams.get(key) || '';
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return utms;
}
