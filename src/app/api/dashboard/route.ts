import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';
import { formatPaise } from '@/lib/format';
import { getIstStartOfDay, getIstEndOfDay } from '@/lib/dateUtils';

export async function GET() {
  try {
    await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  try {
    const todayStart = getIstStartOfDay();
    const todayEnd = getIstEndOfDay();

    // 1. All-time aggregate
    const allPaidOrders = await prisma.order.aggregate({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // 2. Today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        orderItems: true,
      },
    });

    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];
    const todayPaidOrders = todayOrders.filter((o) => paidStatuses.includes(o.status));

    const todayRevenuePaise = todayPaidOrders.reduce((acc, o) => acc + o.total, 0);

    // 3. Customer count (unique phones)
    const distinctPhones = await prisma.order.findMany({
      where: { customerPhone: { not: null } },
      select: { customerPhone: true },
      distinct: ['customerPhone'],
    });

    // 4. Menu Items count
    const menuItemsCount = await prisma.menuItem.count();

    // 5. Payment method split today
    let cashRevenue = 0;
    let upiRevenue = 0;
    todayPaidOrders.forEach((o) => {
      if (o.paymentMethod === 'CASH') cashRevenue += o.total;
      else upiRevenue += o.total;
    });

    // 6. Popular items today (or all-time if today is low)
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    todayPaidOrders.forEach((o) => {
      o.orderItems.forEach((item) => {
        const existing = itemMap.get(item.itemName) || { name: item.itemName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        itemMap.set(item.itemName, existing);
      });
    });

    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((i) => ({
        ...i,
        revenueFormatted: formatPaise(i.revenue),
      }));

    // 7. Recent 10 orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        type: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        customerName: true,
        customerPhone: true,
        total: true,
        createdAt: true,
        orderItems: {
          select: {
            itemName: true,
            quantity: true,
          },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalSalesPaise: allPaidOrders._sum.total || 0,
        totalSalesFormatted: formatPaise(allPaidOrders._sum.total || 0),
        totalOrdersCount: allPaidOrders._count.id || 0,
        todaySalesPaise: todayRevenuePaise,
        todaySalesFormatted: formatPaise(todayRevenuePaise),
        todayOrdersCount: todayOrders.length,
        todayPaidCount: todayPaidOrders.length,
        totalCustomersCount: distinctPhones.length,
        totalMenuItemsCount: menuItemsCount,
        cashRevenueFormatted: formatPaise(cashRevenue),
        upiRevenueFormatted: formatPaise(upiRevenue),
      },
      popularItems,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalFormatted: formatPaise(o.total),
        itemsSummary: o.orderItems.map((i) => `${i.quantity}x ${i.itemName}`).join(', '),
      })),
    });
  } catch (error) {
    console.error('Failed to load dashboard overview:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}

