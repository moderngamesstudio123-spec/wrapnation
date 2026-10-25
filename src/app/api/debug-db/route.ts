import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');

  let connectionSuccess = false;
  let errorMsg = null;
  let userCount = 0;
  let orderCount = 0;

  try {
    userCount = await prisma.user.count();
    orderCount = await prisma.order.count();
    connectionSuccess = true;
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  return NextResponse.json({
    maskedUrl,
    connectionSuccess,
    errorMsg,
    userCount,
    orderCount,
  });
}
