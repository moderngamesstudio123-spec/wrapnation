import { NextResponse } from 'next/server';
import { getAllFallbackOrders } from '@/server/services/orderStore';

export async function GET() {
  const errors: any[] = [];
  let orders: any[] = [];
  try {
    orders = await getAllFallbackOrders();
  } catch (err: any) {
    errors.push(err.message || String(err));
  }

  // Also test direct cloud fetch
  let cloudRes: any = null;
  try {
    const res = await fetch('https://api.restful-api.dev/objects/ff808181a09d98f701a17438527f0a16', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    cloudRes = {
      status: res.status,
      data: await res.json(),
    };
  } catch (err: any) {
    cloudRes = { error: err.message || String(err) };
  }

  return NextResponse.json({
    ordersCount: orders.length,
    orders,
    errors,
    cloudRes,
  });
}
