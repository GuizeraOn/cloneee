import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const latestRate = await prisma.exchangeRate.findFirst({
      orderBy: {
        fetchedAt: 'desc'
      }
    });

    if (!latestRate) {
      return NextResponse.json({ rate: 5.65, source: 'fallback', fetchedAt: new Date().toISOString() });
    }

    return NextResponse.json({
      rate: latestRate.rate,
      source: latestRate.source,
      fetchedAt: latestRate.fetchedAt
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
