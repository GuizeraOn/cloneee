import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchLatestUsdBrlRate } from '@/lib/exchange-rate';

export async function GET(req: NextRequest) {
  try {
    // Optionally secure this endpoint with a cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await fetchLatestUsdBrlRate();

    await prisma.exchangeRate.create({
      data: {
        rate,
        source: 'awesomeapi',
      }
    });

    return NextResponse.json({ success: true, rate }, { status: 200 });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to fetch and store exchange rate' }, { status: 500 });
  }
}
