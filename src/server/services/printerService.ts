import prisma from '@/lib/db';
import { SlipType, PrintJobStatus } from '@prisma/client';
import { getSettings } from './settingService';
import { formatPaise } from '@/lib/format';
import { sseBroker } from '@/lib/sse/broker';

export interface KitchenSlipItem {
  itemName: string;
  variantName?: string | null;
  addOns: string[];
  quantity: number;
  notes?: string | null;
}

export interface KitchenSlipPayload {
  slipType: 'KITCHEN';
  orderNumber: number;
  takeawayToken?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: number | null;
  createdAt: string;
  cookingNote?: string | null;
  items: KitchenSlipItem[];
  paperWidth: '80' | '58';
}

export interface BillItem {
  itemName: string;
  variantName?: string | null;
  addOns: Array<{ name: string; price: number }>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerBillPayload {
  slipType: 'CUSTOMER_BILL';
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  gstin?: string | null;
  gstEnabled: boolean;
  gstPercentage: number;
  orderNumber: number;
  takeawayToken?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  paymentMethod: string;
  paymentStatus: string;
  utr?: string | null;
  paperWidth: '80' | '58';
}

/**
 * Creates print jobs for an order.
 * By default queues both Kitchen Slip and Customer Bill upon payment.
 */
export async function queueOrderPrintJobs(orderId: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.printerEnabled) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      payments: {
        where: { status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) return;

  const paperWidth = settings.printerPaperWidth;
  const payment = order.payments[0];

  // 1. Prepare Kitchen Slip Payload (NO PRICES)
  const kitchenItems: KitchenSlipItem[] = order.orderItems.map((item) => {
    let addOnNames: string[] = [];
    try {
      const parsed = JSON.parse(item.addOnsJson || '[]');
      addOnNames = parsed.map((a: { name: string }) => a.name);
    } catch {}

    return {
      itemName: item.itemName,
      variantName: item.variantName,
      addOns: addOnNames,
      quantity: item.quantity,
      notes: item.notes,
    };
  });

  const kitchenPayload: KitchenSlipPayload = {
    slipType: 'KITCHEN',
    orderNumber: order.orderNumber,
    takeawayToken: order.takeawayToken,
    orderType: order.type,
    tableNumber: order.tableNumber,
    createdAt: order.createdAt.toISOString(),
    cookingNote: order.cookingNote,
    items: kitchenItems,
    paperWidth,
  };
  void kitchenPayload;

  // 2. Prepare Customer Bill Payload
  const billItems: BillItem[] = order.orderItems.map((item) => {
    let addOns: Array<{ name: string; price: number }> = [];
    try {
      addOns = JSON.parse(item.addOnsJson || '[]');
    } catch {}

    return {
      itemName: item.itemName,
      variantName: item.variantName,
      addOns,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    };
  });

  const billPayload: CustomerBillPayload = {
    slipType: 'CUSTOMER_BILL',
    shopName: settings.shopName,
    shopAddress: settings.shopAddress,
    shopPhone: settings.shopPhone,
    gstin: settings.gstEnabled && settings.gstin ? settings.gstin : null,
    gstEnabled: settings.gstEnabled,
    gstPercentage: settings.gstPercentage,
    orderNumber: order.orderNumber,
    takeawayToken: order.takeawayToken,
    orderType: order.type,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt.toISOString(),
    items: billItems,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    subtotalFormatted: formatPaise(order.subtotal),
    taxFormatted: formatPaise(order.tax),
    totalFormatted: formatPaise(order.total),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    utr: payment?.utr || null,
    paperWidth,
  };

  // Queue Bill Job (Sirf Customer Bill print hoga as requested)
  const billJob = await prisma.printJob.create({
    data: {
      orderId: order.id,
      slipType: SlipType.CUSTOMER_BILL,
      status: PrintJobStatus.PENDING,
      payloadJson: JSON.stringify(billPayload),
    },
  });

  // Broadcast to SSE listeners
  sseBroker.broadcast('PRINTER_JOB_CREATED', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    jobs: [billJob.id],
  });
}

/**
 * Triggers a manual reprint of either Kitchen Slip, Customer Bill, or both.
 */
export async function triggerReprint(
  orderId: string,
  slipType?: 'KITCHEN' | 'CUSTOMER_BILL'
): Promise<{ success: boolean; queuedJobs: number }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      payments: { where: { status: 'PAID' }, take: 1 },
    },
  });

  if (!order) return { success: false, queuedJobs: 0 };

  const settings = await getSettings();
  const paperWidth = settings.printerPaperWidth;
  let count = 0;

  if (slipType === 'KITCHEN') {
    const kitchenItems: KitchenSlipItem[] = order.orderItems.map((item) => {
      let addOnNames: string[] = [];
      try {
        const parsed = JSON.parse(item.addOnsJson || '[]');
        addOnNames = parsed.map((a: { name: string }) => a.name);
      } catch {}

      return {
        itemName: item.itemName,
        variantName: item.variantName,
        addOns: addOnNames,
        quantity: item.quantity,
        notes: item.notes,
      };
    });

    const kitchenPayload: KitchenSlipPayload = {
      slipType: 'KITCHEN',
      orderNumber: order.orderNumber,
      takeawayToken: order.takeawayToken,
      orderType: order.type,
      tableNumber: order.tableNumber,
      createdAt: order.createdAt.toISOString(),
      cookingNote: order.cookingNote,
      items: kitchenItems,
      paperWidth,
    };

    await prisma.printJob.create({
      data: {
        orderId: order.id,
        slipType: SlipType.KITCHEN,
        status: PrintJobStatus.PENDING,
        payloadJson: JSON.stringify(kitchenPayload),
      },
    });
    count++;
  }

  if (!slipType || slipType === 'CUSTOMER_BILL') {
    const payment = order.payments[0];
    const billItems: BillItem[] = order.orderItems.map((item) => {
      let addOns: Array<{ name: string; price: number }> = [];
      try {
        addOns = JSON.parse(item.addOnsJson || '[]');
      } catch {}

      return {
        itemName: item.itemName,
        variantName: item.variantName,
        addOns,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      };
    });

    const billPayload: CustomerBillPayload = {
      slipType: 'CUSTOMER_BILL',
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      gstin: settings.gstEnabled && settings.gstin ? settings.gstin : null,
      gstEnabled: settings.gstEnabled,
      gstPercentage: settings.gstPercentage,
      orderNumber: order.orderNumber,
      takeawayToken: order.takeawayToken,
      orderType: order.type,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt.toISOString(),
      items: billItems,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      subtotalFormatted: formatPaise(order.subtotal),
      taxFormatted: formatPaise(order.tax),
      totalFormatted: formatPaise(order.total),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      utr: payment?.utr || null,
      paperWidth,
    };

    await prisma.printJob.create({
      data: {
        orderId: order.id,
        slipType: SlipType.CUSTOMER_BILL,
        status: PrintJobStatus.PENDING,
        payloadJson: JSON.stringify(billPayload),
      },
    });
    count++;
  }

  sseBroker.broadcast('PRINTER_JOB_CREATED', { orderId: order.id, reprint: true });
  return { success: true, queuedJobs: count };
}
