import { NextRequest, NextResponse } from 'next/server';
import { expireStaleUnpaidOrders } from '@/server/services/orderService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  // Protect route with CRON_SECRET Bearer token
  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const expiredCount = await expireStaleUnpaidOrders();
    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/expire] Failed to expire stale unpaid orders:', err);
    return NextResponse.json(
      { error: 'Failed to expire stale unpaid orders' },
      { status: 500 }
    );
  }
}
