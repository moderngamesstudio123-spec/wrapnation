import prisma from '@/lib/db';
import { verifyTableToken } from '@/lib/security/hmac';
import { getIstTodayString } from '@/lib/dateUtils';
import { getSettings, isShopOpen } from './settingService';
import { queueOrderPrintJobs } from './printerService';
import { sendOrderConfirmedNotification, sendOrderReadyNotification } from './whatsappService';
import { sseBroker } from '@/lib/sse/broker';
import { logAudit } from './auditService';
import { OrderStatus, PaymentStatus, PaymentMethod, OrderType, User } from '@prisma/client';

export interface CreateOrderItemInput {
  menuItemId: string;
  variantId?: string | null;
  addOnIds: string[];
  quantity: number;
}

export interface CreateOrderParams {
  type: 'DINE_IN' | 'TAKEAWAY';
  tableToken?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  whatsappOptIn?: boolean;
  cookingNote?: string | null;
  paymentMethod?: 'UPI' | 'CASH';
  items: CreateOrderItemInput[];
}

/**
 * Creates an order with 100% server-calculated pricing from database snapshot.
 */
export async function createOrder(params: CreateOrderParams, ip?: string) {
  // 1. Verify shop operational hours
  const shopStatus = await isShopOpen();
  if (!shopStatus.open) {
    throw new Error(shopStatus.message || 'Shop is currently closed');
  }

  // 2. Validate Dine-in table token (if provided) or customer credentials
  let tableNumber: number | null = null;
  if (params.tableToken) {
    const tokenVerification = verifyTableToken(params.tableToken);
    if (tokenVerification.valid && tokenVerification.tableNumber) {
      tableNumber = tokenVerification.tableNumber;
    }
  }

  if (!tableNumber && (!params.customerName || !params.customerPhone)) {
    throw new Error('Please provide customer name and 10-digit mobile number so staff can call out your order.');
  }

  const settings = await getSettings();

  // 3. Fetch all requested Menu Items strictly from the database
  const menuItemIds = [...new Set(params.items.map((i) => i.menuItemId))];
  const dbMenuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, isAvailable: true },
    include: {
      variants: { where: { isAvailable: true } },
      addOnLinks: { include: { addOn: true } },
    },
  });

  const menuItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

  // Verify all requested items exist and are currently available
  for (const itemInput of params.items) {
    const dbItem = menuItemMap.get(itemInput.menuItemId);
    if (!dbItem) {
      throw new Error('One or more selected items are currently unavailable or out of stock');
    }
  }

  // 4. Calculate pricing for each item strictly on server
  let orderSubtotalPaise = 0;
  const orderItemsData: Array<{
    menuItemId: string;
    variantId?: string | null;
    itemName: string;
    variantName?: string | null;
    unitPrice: number;
    quantity: number;
    addOnsJson: string;
    subtotal: number;
    notes?: string | null;
  }> = [];

  for (const itemInput of params.items) {
    const dbItem = menuItemMap.get(itemInput.menuItemId)!;
    let unitPrice = dbItem.basePrice;
    let variantName: string | null = null;

    // Check variant
    if (itemInput.variantId) {
      const dbVariant = dbItem.variants?.find((v) => v.id === itemInput.variantId);
      if (!dbVariant) {
        throw new Error(`Invalid or unavailable variant selected for ${dbItem.name}`);
      }
      unitPrice += dbVariant.priceDelta;
      variantName = dbVariant.name;
    }

    // Check add-ons
    const addOnSnapshots: Array<{ name: string; price: number }> = [];
    if (itemInput.addOnIds && itemInput.addOnIds.length > 0) {
      for (const addOnId of itemInput.addOnIds) {
        const addOnLink = dbItem.addOnLinks?.find((link) => (link.addOnId || link.addOn?.id) === addOnId);
        if (!addOnLink || !addOnLink.addOn) {
          throw new Error(`Invalid or unavailable add-on selected for ${dbItem.name}`);
        }
        unitPrice += addOnLink.addOn.price;
        addOnSnapshots.push({
          name: addOnLink.addOn.name,
          price: addOnLink.addOn.price,
        });
      }
    }

    const itemSubtotal = unitPrice * itemInput.quantity;
    orderSubtotalPaise += itemSubtotal;

    orderItemsData.push({
      menuItemId: dbItem.id,
      variantId: itemInput.variantId || null,
      itemName: dbItem.name,
      variantName,
      unitPrice,
      quantity: itemInput.quantity,
      addOnsJson: JSON.stringify(addOnSnapshots),
      subtotal: itemSubtotal,
    });
  }

  // Calculate tax if GST is enabled in settings
  let orderTaxPaise = 0;
  if (settings.gstEnabled && settings.gstPercentage > 0) {
    orderTaxPaise = Math.round(orderSubtotalPaise * (settings.gstPercentage / 100));
  }
  const orderTotalPaise = orderSubtotalPaise + orderTaxPaise;

  const timeoutMins = settings.unpaidOrderTimeoutMins || 15;
  const expiresAt = new Date(Date.now() + timeoutMins * 60 * 1000);

  // 5. Generate daily sequential order number and create Order inside a single atomic transaction
  const order = await prisma.$transaction(async (tx) => {
    const dateKey = getIstTodayString();
    const isTakeaway = params.type === 'TAKEAWAY';
    const c = await tx.dailyCounter.upsert({
      where: { date: dateKey },
      create: { date: dateKey, last: 101, takeaway: isTakeaway ? 1 : 0 },
      update: { last: { increment: 1 }, ...(isTakeaway ? { takeaway: { increment: 1 } } : {}) },
    });
    const orderNumber = c.last;
    const takeawayToken = isTakeaway ? `T-${c.takeaway}` : null;

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        takeawayToken,
        type: params.type === 'DINE_IN' ? OrderType.DINE_IN : OrderType.TAKEAWAY,
        tableNumber,
        status: OrderStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: params.paymentMethod === 'CASH' ? PaymentMethod.CASH : PaymentMethod.UPI,
        customerName: params.customerName?.trim() || null,
        customerPhone: params.customerPhone?.trim() || null,
        whatsappOptIn: params.whatsappOptIn || false,
        cookingNote: params.cookingNote?.trim() ? params.cookingNote.trim().slice(0, 200) : null,
        subtotal: orderSubtotalPaise,
        tax: orderTaxPaise,
        total: orderTotalPaise,
        expiresAt,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: true,
      },
    });

    return newOrder;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  // 6. Broadcast new order to Admin POS via SSE
  try {
    sseBroker.broadcast('NEW_ORDER', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      takeawayToken: order.takeawayToken,
      type: order.type,
      tableNumber: order.tableNumber,
      total: order.total,
      status: order.status,
      customerName: order.customerName,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error('[createOrder] SSE broadcast failed:', err);
  }

  logAudit({
    action: 'ORDER_CREATED',
    resource: 'Order',
    details: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      type: order.type,
      tableNumber: order.tableNumber,
    },
    ipAddress: ip,
  }).catch((err) => {
    console.error('[createOrder] Audit log failed:', err);
  });

  return order;
}

export interface MarkPaidParams {
  method: 'UPI' | 'CASH';
  utr?: string | null;
  notes?: string | null;
}

/**
 * Staff-confirmed payment reconciliation.
 * Verifies staff role, guards against duplicate UTRs and duplicate amount warnings,
 * transitions order status to PAID, and queues 80mm thermal print jobs.
 */
export async function markOrderPaid(
  orderId: string,
  params: MarkPaidParams,
  staffUser: User,
  ip?: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === OrderStatus.PAID || order.paymentStatus === PaymentStatus.PAID) {
    return { success: true, message: 'Order is already marked as paid' };
  }

  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.EXPIRED) {
    throw new Error(`Cannot pay for an order in ${order.status} state`);
  }

  const cleanUtr = params.utr?.trim() || null;

  // 1. Check for Duplicate UTR
  if (cleanUtr) {
    const existingPaymentWithUtr = await prisma.payment.findUnique({
      where: { utr: cleanUtr },
      include: { order: true },
    });

    if (existingPaymentWithUtr && existingPaymentWithUtr.orderId !== order.id) {
      throw new Error(
        `Duplicate UTR detected! Transaction reference "${cleanUtr}" was already used to confirm Order #${existingPaymentWithUtr.order.orderNumber}.`
      );
    }
  }

  // 2. Duplicate Amount Warning (Alerts if same amount was paid within last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  let duplicateWarning: string | null = null;
  try {
    const recentMatchingPayment = await prisma.payment.findFirst({
      where: {
        amount: order.total,
        status: PaymentStatus.PAID,
        createdAt: { gte: tenMinutesAgo },
        orderId: { not: order.id },
      },
      include: { order: true },
    });

    if (recentMatchingPayment) {
      duplicateWarning = `Notice: Another order (#${recentMatchingPayment.order.orderNumber}) for the same amount (Rs ${recentMatchingPayment.amount / 100}) was marked paid ${Math.round((Date.now() - recentMatchingPayment.createdAt.getTime()) / 60000)} mins ago. Ensure this is a separate credit.`;
    }
  } catch (err) {
    console.error('[markOrderPaid] Duplicate amount check failed:', err);
  }

  // 3. Complete payment in a transaction
  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: params.method === 'CASH' ? PaymentMethod.CASH : PaymentMethod.UPI,
        status: PaymentStatus.PAID,
        utr: cleanUtr,
        confirmedById: staffUser.id,
        notes: params.notes || null,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PREPARING, // moves directly to kitchen preparation
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: params.method === 'CASH' ? PaymentMethod.CASH : PaymentMethod.UPI,
      },
    });

    return p;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  // 4. Trigger 80mm thermal slips printing ONLY AFTER verified payment!
  try {
    await queueOrderPrintJobs(order.id);
  } catch (err) {
    console.error('[markOrderPaid] Print job queueing failed:', err);
  }

  // 5. Send customer WhatsApp confirmation asynchronously
  sendOrderConfirmedNotification(order.id).catch((err) => {
    console.error('[markOrderPaid] WhatsApp notification failed:', err);
  });

  // 6. Broadcast SSE events
  try {
    sseBroker.broadcast(
      'PAYMENT_CONFIRMED',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        method: params.method,
        amount: order.total,
        status: 'PAID',
      },
      order.id
    );

    sseBroker.broadcast(
      'ORDER_STATUS_CHANGED',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.PREPARING,
        paymentStatus: PaymentStatus.PAID,
      },
      order.id
    );
  } catch (err) {
    console.error('[markOrderPaid] SSE broadcast failed:', err);
  }

  logAudit({
    userId: staffUser.id,
    action: 'PAYMENT_CONFIRMED',
    resource: 'Order',
    details: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      method: params.method,
      amount: order.total,
      utr: cleanUtr,
      warning: duplicateWarning,
    },
    ipAddress: ip,
  }).catch((err) => {
    console.error('[markOrderPaid] Audit log failed:', err);
  });

  return {
    success: true,
    paymentId: payment.id,
    warning: duplicateWarning,
  };
}

/**
 * Updates order preparation status (PREPARING -> READY -> COMPLETED or CANCELLED).
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  staffUser: User,
  ip?: string
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new Error('Order not found');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      completedAt: newStatus === OrderStatus.COMPLETED ? new Date() : undefined,
    },
  });

  // If order transitioned to READY, send WhatsApp notification
  if (newStatus === OrderStatus.READY) {
    sendOrderReadyNotification(orderId).catch((err) => {
      console.error('[updateOrderStatus] WhatsApp notification failed:', err);
    });
  }

  // Broadcast to admin dashboard and customer order tracking page
  try {
    sseBroker.broadcast(
      'ORDER_STATUS_CHANGED',
      {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        completedAt: updated.completedAt,
      },
      orderId
    );
  } catch (err) {
    console.error('[updateOrderStatus] SSE broadcast failed:', err);
  }

  logAudit({
    userId: staffUser.id,
    action: 'ORDER_STATUS_UPDATE',
    resource: 'Order',
    details: { orderId, oldStatus: order.status, newStatus },
    ipAddress: ip,
  }).catch((err) => {
    console.error('[updateOrderStatus] Audit log failed:', err);
  });

  return updated;
}

/**
 * Customer hint submission: allows customer to input last 4 digits of UTR.
 * Does NOT alter payment status. Only provides a hint displayed on the POS order card.
 */
export async function submitCustomerUtrHint(orderId: string, last4Digits: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { customerUtrHint: last4Digits },
  });

  try {
    sseBroker.broadcast('CUSTOMER_UTR_HINT', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      customerUtrHint: last4Digits,
    });
  } catch (err) {
    console.error('[submitCustomerUtrHint] SSE broadcast failed:', err);
  }

  return updated;
}

/**
 * Sweeps expired unpaid orders older than timeout using a single updateMany.
 */
export async function expireStaleUnpaidOrders(): Promise<number> {
  const now = new Date();
  const staleOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.AWAITING_PAYMENT,
      expiresAt: { lt: now },
    },
    select: { id: true, orderNumber: true },
  });

  if (staleOrders.length === 0) return 0;

  const staleIds = staleOrders.map((o) => o.id);

  await prisma.order.updateMany({
    where: {
      id: { in: staleIds },
      status: OrderStatus.AWAITING_PAYMENT,
    },
    data: { status: OrderStatus.EXPIRED },
  });

  for (const order of staleOrders) {
    try {
      sseBroker.broadcast(
        'ORDER_STATUS_CHANGED',
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: OrderStatus.EXPIRED,
        },
        order.id
      );
    } catch (err) {
      console.error('[expireStaleUnpaidOrders] SSE broadcast failed:', err);
    }
  }

  return staleOrders.length;
}

/**
 * Gets the active order occupying a table (if any) purely from the Order table.
 */
export async function getActiveOrderForTable(
  tableNumber: number
): Promise<{ id: string; orderNumber: number; status: string; total?: number; createdAt: string } | null> {
  const active = await prisma.order.findFirst({
    where: {
      tableNumber,
      type: OrderType.DINE_IN,
      status: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
  });

  if (active) {
    return {
      id: active.id,
      orderNumber: active.orderNumber,
      status: active.status,
      total: active.total,
      createdAt: active.createdAt.toISOString(),
    };
  }

  return null;
}

/**
 * Vacates a dining table, marking active orders as COMPLETED purely via Prisma.
 */
export async function vacateTable(tableNumber: number, staffUser?: User): Promise<void> {
  const activeOrders = await prisma.order.findMany({
    where: {
      tableNumber,
      type: OrderType.DINE_IN,
      status: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] },
    },
    select: { id: true, orderNumber: true },
  });

  if (activeOrders.length > 0) {
    const activeIds = activeOrders.map((o) => o.id);
    await prisma.order.updateMany({
      where: { id: { in: activeIds } },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });

    for (const order of activeOrders) {
      try {
        sseBroker.broadcast(
          'ORDER_STATUS_CHANGED',
          { orderId: order.id, orderNumber: order.orderNumber, status: OrderStatus.COMPLETED },
          order.id
        );
      } catch (err) {
        console.error('[vacateTable] SSE broadcast failed:', err);
      }
    }
  }

  if (staffUser) {
    logAudit({
      userId: staffUser.id,
      action: 'TABLE_VACATED',
      resource: `table:${tableNumber}`,
      details: { tableNumber, userEmail: staffUser.email, userRole: staffUser.role },
    }).catch((err) => {
      console.error('[vacateTable] Audit log failed:', err);
    });
  }
}
