import prisma from '@/lib/db';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { formatPaise } from '@/lib/format';

export interface DailyReportSummary {
  date: string;
  totalRevenuePaise: number;
  totalRevenueFormatted: string;
  totalOrdersCount: number;
  upiRevenuePaise: number;
  upiRevenueFormatted: string;
  cashRevenuePaise: number;
  cashRevenueFormatted: string;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  topSellingItems: Array<{
    itemName: string;
    quantity: number;
    revenuePaise: number;
    revenueFormatted: string;
  }>;
}

export async function getDailyReport(targetDate: Date = new Date()): Promise<DailyReportSummary> {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all paid orders for the target day
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      paymentStatus: PaymentStatus.PAID,
    },
    include: {
      orderItems: true,
      payments: { where: { status: PaymentStatus.PAID } },
    },
  });

  let totalRevenuePaise = 0;
  let upiRevenuePaise = 0;
  let cashRevenuePaise = 0;
  let dineInOrdersCount = 0;
  let takeawayOrdersCount = 0;

  const itemMap = new Map<string, { quantity: number; revenuePaise: number }>();

  for (const order of orders) {
    totalRevenuePaise += order.total;

    if (order.type === 'DINE_IN') {
      dineInOrdersCount++;
    } else {
      takeawayOrdersCount++;
    }

    if (order.paymentMethod === PaymentMethod.UPI) {
      upiRevenuePaise += order.total;
    } else {
      cashRevenuePaise += order.total;
    }

    for (const item of order.orderItems) {
      const current = itemMap.get(item.itemName) || { quantity: 0, revenuePaise: 0 };
      itemMap.set(item.itemName, {
        quantity: current.quantity + item.quantity,
        revenuePaise: current.revenuePaise + item.subtotal,
      });
    }
  }

  const topSellingItems = Array.from(itemMap.entries())
    .map(([itemName, data]) => ({
      itemName,
      quantity: data.quantity,
      revenuePaise: data.revenuePaise,
      revenueFormatted: formatPaise(data.revenuePaise),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const dateStr = startOfDay.toISOString().split('T')[0];

  return {
    date: dateStr,
    totalRevenuePaise,
    totalRevenueFormatted: formatPaise(totalRevenuePaise),
    totalOrdersCount: orders.length,
    upiRevenuePaise,
    upiRevenueFormatted: formatPaise(upiRevenuePaise),
    cashRevenuePaise,
    cashRevenueFormatted: formatPaise(cashRevenuePaise),
    dineInOrdersCount,
    takeawayOrdersCount,
    topSellingItems,
  };
}

/**
 * Generates CSV string of all paid orders for a date range for export.
 */
export async function exportOrdersCsv(targetDate: Date = new Date()): Promise<string> {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      paymentStatus: PaymentStatus.PAID,
    },
    include: {
      payments: { where: { status: PaymentStatus.PAID } },
      orderItems: true,
    },
    orderBy: { orderNumber: 'asc' },
  });

  const headers = [
    'Order #',
    'Time',
    'Type',
    'Table / Token',
    'Customer Name',
    'Customer Phone',
    'Payment Mode',
    'UTR / Ref',
    'Subtotal (INR)',
    'Tax (INR)',
    'Total (INR)',
    'Items Summary',
  ];

  const rows = orders.map((o) => {
    const payment = o.payments[0];
    const itemsSummary = o.orderItems.map((i) => `${i.itemName} x${i.quantity}`).join('; ');
    const timeStr = o.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return [
      o.orderNumber,
      timeStr,
      o.type,
      o.type === 'DINE_IN' ? `Table ${o.tableNumber}` : o.takeawayToken || 'Takeaway',
      `"${(o.customerName || 'N/A').replace(/"/g, '""')}"`,
      `"${o.customerPhone || 'N/A'}"`,
      o.paymentMethod,
      `"${payment?.utr || 'N/A'}"`,
      (o.subtotal / 100).toFixed(2),
      (o.tax / 100).toFixed(2),
      (o.total / 100).toFixed(2),
      `"${itemsSummary.replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
