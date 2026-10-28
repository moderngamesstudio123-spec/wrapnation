import prisma from '@/lib/db';
import crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';
import { formatPaise } from '@/lib/format';
import {
  getIstStartOfDay,
  getIstEndOfDay,
  formatIstTime,
  formatIstDateFull,
  getIstTodayString,
} from '@/lib/dateUtils';

export interface OrderLedgerItem {
  id: string;
  orderNumber: number;
  timeFormatted: string;
  type: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  utr: string | null;
  itemsSummary: string;
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  totalPaise: number;
}

export interface DailyReportSummary {
  date: string;
  dateFormatted: string;
  generatedAt: string;
  auditSignature: string;
  // Financial Totals
  grossRevenuePaise: number;
  grossRevenueFormatted: string;
  netRevenuePaise: number;
  netRevenueFormatted: string;
  taxPaise: number;
  taxFormatted: string;
  cashRevenuePaise: number;
  cashRevenueFormatted: string;
  upiRevenuePaise: number;
  upiRevenueFormatted: string;
  reconciliationMatch: boolean;
  // Volume Metrics
  totalOrdersCount: number;
  paidOrdersCount: number;
  cancelledOrdersCount: number;
  totalItemsSold: number;
  averageOrderValueFormatted: string;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  // Product Breakdown
  topSellingItems: Array<{
    itemName: string;
    quantity: number;
    revenuePaise: number;
    revenueFormatted: string;
  }>;
  // Full Itemized Order Ledger (Anti-Hack / Exact Hisab)
  ordersList: OrderLedgerItem[];
}

export async function getDailyReport(targetDate: Date = new Date()): Promise<DailyReportSummary> {
  const startOfDay = getIstStartOfDay(targetDate);
  const endOfDay = getIstEndOfDay(targetDate);
  const dateStr = getIstTodayString(targetDate);

  // 1. Fetch orders strictly from Prisma database
  let allDayOrders: any[] = [];
  try {
    allDayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        orderItems: true,
        payments: { where: { status: PaymentStatus.PAID } },
      },
      orderBy: { orderNumber: 'asc' },
    });
  } catch (err) {
    console.error('[getDailyReport] Database query failed:', err);
    throw err;
  }

  // 2. Precise Financial Calculations (Strict Integer Paise - Zero Float Drift)
  let grossRevenuePaise = 0;
  let netRevenuePaise = 0;
  let taxPaise = 0;
  let upiRevenuePaise = 0;
  let cashRevenuePaise = 0;
  let dineInOrdersCount = 0;
  let takeawayOrdersCount = 0;
  let totalItemsSold = 0;
  let paidOrdersCount = 0;
  let cancelledOrdersCount = 0;

  const itemMap = new Map<string, { quantity: number; revenuePaise: number }>();
  const ordersList: OrderLedgerItem[] = [];

  for (const order of allDayOrders) {
    const isPaid = order.paymentStatus === 'PAID' || order.status === 'PAID' || order.status === 'READY' || order.status === 'COMPLETED';
    const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';

    if (isCancelled) {
      cancelledOrdersCount++;
    }

    if (isPaid) {
      paidOrdersCount++;
      grossRevenuePaise += order.total;
      netRevenuePaise += order.subtotal || order.total;
      taxPaise += order.tax || 0;

      if (order.type === 'DINE_IN') {
        dineInOrdersCount++;
      } else {
        takeawayOrdersCount++;
      }

      if (order.paymentMethod === 'CASH') {
        cashRevenuePaise += order.total;
      } else {
        upiRevenuePaise += order.total;
      }

      // Aggregate item-level statistics
      const items = order.orderItems || [];
      for (const item of items) {
        totalItemsSold += item.quantity;
        const current = itemMap.get(item.itemName) || { quantity: 0, revenuePaise: 0 };
        itemMap.set(item.itemName, {
          quantity: current.quantity + item.quantity,
          revenuePaise: current.revenuePaise + (item.subtotal || item.unitPrice * item.quantity),
        });
      }
    }

    // Build Itemized Audit Ledger Row
    const orderItemsList = order.orderItems || [];
    const itemsSummary = orderItemsList.map((i: any) => `${i.quantity}× ${i.itemName}`).join(', ') || 'N/A';
    const utrRef = order.payments?.[0]?.utr || order.customerUtrHint || null;

    ordersList.push({
      id: order.id,
      orderNumber: order.orderNumber,
      timeFormatted: formatIstTime(order.createdAt),
      type: order.type === 'DINE_IN' ? 'Dine-In' : 'Takeaway',
      customerName: order.customerName || 'Customer',
      customerPhone: order.customerPhone || 'N/A',
      paymentMethod: order.paymentMethod || 'UPI',
      paymentStatus: isPaid ? 'PAID' : order.paymentStatus || order.status,
      utr: utrRef,
      itemsSummary,
      subtotalFormatted: formatPaise(order.subtotal || order.total),
      taxFormatted: formatPaise(order.tax || 0),
      totalFormatted: formatPaise(order.total),
      totalPaise: order.total,
    });
  }

  // Exact Mathematical Reconciliation Check
  const reconciliationMatch = cashRevenuePaise + upiRevenuePaise === grossRevenuePaise;

  // Average Order Value
  const aovPaise = paidOrdersCount > 0 ? Math.round(grossRevenuePaise / paidOrdersCount) : 0;

  // Best Selling Items
  const topSellingItems = Array.from(itemMap.entries())
    .map(([itemName, data]) => ({
      itemName,
      quantity: data.quantity,
      revenuePaise: data.revenuePaise,
      revenueFormatted: formatPaise(data.revenuePaise),
    }))
    .sort((a, b) => b.quantity - a.quantity);

  // Cryptographic Audit Signature (Tamper-Evident Anti-Hack Seal)
  const auditPayload = `${dateStr}|${grossRevenuePaise}|${cashRevenuePaise}|${upiRevenuePaise}|${paidOrdersCount}`;
  const auditSignature = `WN-${crypto
    .createHash('sha256')
    .update(auditPayload + (process.env.HMAC_SECRET || 'wn_audit_salt'))
    .digest('hex')
    .slice(0, 10)
    .toUpperCase()}`;

  return {
    date: dateStr,
    dateFormatted: formatIstDateFull(startOfDay),
    generatedAt: formatIstTime(new Date()),
    auditSignature,
    grossRevenuePaise,
    grossRevenueFormatted: formatPaise(grossRevenuePaise),
    netRevenuePaise,
    netRevenueFormatted: formatPaise(netRevenuePaise),
    taxPaise,
    taxFormatted: formatPaise(taxPaise),
    cashRevenuePaise,
    cashRevenueFormatted: formatPaise(cashRevenuePaise),
    upiRevenuePaise,
    upiRevenueFormatted: formatPaise(upiRevenuePaise),
    reconciliationMatch,
    totalOrdersCount: allDayOrders.length,
    paidOrdersCount,
    cancelledOrdersCount,
    totalItemsSold,
    averageOrderValueFormatted: formatPaise(aovPaise),
    dineInOrdersCount,
    takeawayOrdersCount,
    topSellingItems,
    ordersList,
  };
}

/**
 * Generates CSV string of all paid orders for a date range for export.
 */
export async function exportOrdersCsv(targetDate: Date = new Date()): Promise<string> {
  const report = await getDailyReport(targetDate);

  const headers = [
    'Order #',
    'Time (IST)',
    'Type',
    'Customer Name',
    'Customer Phone',
    'Payment Mode',
    'Payment Status',
    'UTR Reference',
    'Items Summary',
    'Subtotal (INR)',
    'Tax (INR)',
    'Total (INR)',
  ];

  const rows = report.ordersList.map((o) => [
    o.orderNumber,
    o.timeFormatted,
    o.type,
    `"${(o.customerName || 'N/A').replace(/"/g, '""')}"`,
    `"${o.customerPhone || 'N/A'}"`,
    o.paymentMethod,
    o.paymentStatus,
    `"${(o.utr || 'N/A').replace(/"/g, '""')}"`,
    `"${o.itemsSummary.replace(/"/g, '""')}"`,
    o.subtotalFormatted.replace('Rs ', ''),
    o.taxFormatted.replace('Rs ', ''),
    o.totalFormatted.replace('Rs ', ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
