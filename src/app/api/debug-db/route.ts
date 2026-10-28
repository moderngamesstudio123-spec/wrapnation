import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  // Mask credentials for safety
  const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  
  // Test query
  const count = await prisma.order.count();
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    maskedDatabaseUrl: masked,
    ordersCount: count,
    latestOrder,
  });
}
