import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveDateRange } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const dateFilter = resolveDateRange({ preset, startDate, endDate });

    const where = Object.keys(dateFilter).length > 0 ? { purchasedAt: dateFilter } : {};

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          purchasedAt: 'desc'
        }
      }),
      prisma.sale.count({ where })
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Sales list error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
