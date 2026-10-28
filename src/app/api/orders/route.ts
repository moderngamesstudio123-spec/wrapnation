import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/server/services/orderService';
import { createOrderSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db';
import { getIstStartOfDay } from '@/lib/dateUtils';
import { OrderStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KNOWN_BUSINESS_ERRORS = [
  'Shop is currently closed',
  'Please provide customer name and 10-digit mobile number',
  'One or more selected items are currently unavailable',
  'Invalid or unavailable variant selected',
  'Invalid or unavailable add-on selected',
];

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
    const orderItems = (order.orderItems || []).map((i) => ({
      id: i.id,
      itemName: i.itemName,
      variantName: i.variantName || null,
      unitPrice: i.unitPrice,
      unitPriceFormatted: `Rs ${Math.round(i.unitPrice / 100)}`,
      quantity: i.quantity,
      subtotal: i.subtotal,
      subtotalFormatted: `Rs ${Math.round(i.subtotal / 100)}`,
      addOns: (() => {
        try {
          return i.addOnsJson ? JSON.parse(i.addOnsJson) : [];
        } catch {
          return [];
        }
      })(),
      notes: i.notes || null,
    }));

    const responseOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      takeawayToken: order.takeawayToken,
      type: order.type,
      tableNumber: order.tableNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerUtrHint: order.customerUtrHint,
      cookingNote: order.cookingNote,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      subtotalFormatted: `Rs ${Math.round(order.subtotal / 100)}`,
      taxFormatted: `Rs ${Math.round(order.tax / 100)}`,
      totalFormatted: `Rs ${Math.round(order.total / 100)}`,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      orderItems,
    };

    const res = NextResponse.json({
      success: true,
      order: responseOrder,
    });

    try {
      res.cookies.set('wn_last_order_id', order.id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400,
        sameSite: 'lax',
      });
    } catch {}

    return res;
  } catch (err: unknown) {
    console.error('[POST /api/orders] Order creation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create order';
    const isBusinessError = KNOWN_BUSINESS_ERRORS.some((msg) => message.includes(msg));

    if (isBusinessError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Service temporarily unavailable, please try again' },
      { status: 503 }
    );
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

  // Fetch today's orders (IST midnight) OR active orders regardless of date
  const startOfDay = getIstStartOfDay();
  const activeStatuses: OrderStatus[] = [
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.READY,
  ];

  const orConditions: Prisma.OrderWhereInput[] = [
    { createdAt: { gte: startOfDay } },
    { status: { in: activeStatuses } },
  ];

  const whereClause: Prisma.OrderWhereInput = statusParam
    ? {
        AND: [
          { OR: orConditions },
          { status: statusParam as OrderStatus },
        ],
      }
    : {
        OR: orConditions,
      };

  try {
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(
      { orders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/orders] Database unavailable error:', err);
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
