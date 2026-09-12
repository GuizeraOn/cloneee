import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchLatestUsdBrlRate } from '@/lib/exchange-rate';
import { normalizeFunnelStage, normalizePaymentMethod, normalizeStatus, extractUtm } from '@/lib/hotmart-utils';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Hottok
    const hottok = req.headers.get('x-token'); // Assuming sent in headers, or it could be in payload.hottok
    const EXPECTED_HOTTOK = process.env.HOTMART_HOTTOK;
    
    // In production we should strictly enforce this. For local testing without env var, we'll allow it if env var is not set.
    if (EXPECTED_HOTTOK && hottok !== EXPECTED_HOTTOK) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // 2. Validate basic structure
    const transactionId = payload?.data?.transaction ?? payload?.transaction;
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    // 3. Extract and normalize fields
    // Assuming Hotmart Webhook 2.0 structure
    const productName = payload?.data?.product?.name ?? 'Unknown Product';
    const rawStatus = payload?.data?.status ?? payload?.status ?? 'UNKNOWN';
    const status = normalizeStatus(rawStatus);
    const paymentMethod = normalizePaymentMethod(payload?.data?.payment?.type ?? 'UNKNOWN');
    const funnelStage = normalizeFunnelStage(productName);
    
    // Calculate values
    const grossUsd = payload?.data?.commissions?.[0]?.value ?? payload?.price ?? 0;
    const netUsd = payload?.data?.commissions?.[0]?.source === 'HOTMART' ? (grossUsd * 0.9) : grossUsd; // Simplified example
    
    // 4. Fetch exchange rate
    const exchangeRate = await fetchLatestUsdBrlRate();
    const grossBrl = grossUsd * exchangeRate;
    const netBrl = netUsd * exchangeRate;

    // 5. Store in database with Deduplication (ON CONFLICT DO NOTHING)
    // Prisma uses `upsert` for on conflict do update, but for DO NOTHING, we can try to create and catch unique constraint error, 
    // or use createMany with skipDuplicates. Since we only have one, we can try/catch.
    try {
      await prisma.sale.create({
        data: {
          transactionId: String(transactionId),
          purchasedAt: new Date(payload?.creation_date ?? Date.now()),
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
      // Prisma error code for unique constraint violation is P2002
      if (dbError.code === 'P2002') {
        console.log(`Transaction ${transactionId} already exists. Deduplicated.`);
        // Return 200 to Hotmart so it stops retrying
        return NextResponse.json({ success: true, message: 'Deduplicated' }, { status: 200 });
      }
      throw dbError; // rethrow if it's another error
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
