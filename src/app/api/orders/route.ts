import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/server/services/orderService';
import { createOrderSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Sliding-window rate limit (10 orders per minute per IP)
  const rateLimit = checkRateLimit(`order_create:${ip}`, { windowMs: 60000, maxRequests: 10 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many orders placed from this network. Please wait a minute before trying again.' },
      { status: 429, headers: { 'Retry-After': `${Math.ceil(rateLimit.resetMs / 1000)}` } }
    );
  }

  // 2. Validate input
  const body = await req.json().catch(() => null);
  const parseResult = createOrderSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(parseResult.data, ip);
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        takeawayToken: order.takeawayToken,
        type: order.type,
        tableNumber: order.tableNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        expiresAt: order.expiresAt,
        createdAt: order.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // STAFF or OWNER
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  // Fetch today's orders or active orders
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const whereClause: Record<string, unknown> = {
    createdAt: { gte: startOfDay },
  };

  if (statusParam) {
    whereClause.status = statusParam;
  }

  try {
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.warn('Database connection warning in GET /api/orders:', err);
    return NextResponse.json({ orders: [] });
  }
}
