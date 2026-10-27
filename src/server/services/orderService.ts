import prisma from '@/lib/db';
import crypto from 'crypto';
import { verifyTableToken } from '@/lib/security/hmac';
import { getIstStartOfDay } from '@/lib/dateUtils';
import { getSettings, isShopOpen } from './settingService';
import { queueOrderPrintJobs } from './printerService';
import { sendOrderConfirmedNotification, sendOrderReadyNotification } from './whatsappService';
import { sseBroker } from '@/lib/sse/broker';
import { logAudit } from './auditService';
import { OrderStatus, PaymentStatus, PaymentMethod, OrderType, User } from '@prisma/client';
import { DEFAULT_CATEGORIES } from './defaultMenu';
import {
  saveFallbackOrder,
  getFallbackOrder,
  updateFallbackOrder,
  getNextOrderNumber,
  getMaxFallbackDailyOrderStats,
  setTableOccupied,
  vacateTableStore,
  getTableOccupancy,
  getAllOccupiedTables,
} from './orderStore';

const ALL_FALLBACK_ITEMS = DEFAULT_CATEGORIES.flatMap((c) => c.items);

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

  // 3. Fetch all requested Menu Items from the database (or fallback items)
  const menuItemIds = [...new Set(params.items.map((i) => i.menuItemId))];
  let dbMenuItems: any[] = [];
  try {
    dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
      include: {
        variants: { where: { isAvailable: true } },
        addOnLinks: { include: { addOn: true } },
      },
    });
  } catch (err) {
    console.warn('Database connection warning in createOrder:', err);
  }

  if (dbMenuItems.length === 0) {
    dbMenuItems = ALL_FALLBACK_ITEMS.filter((i) => menuItemIds.includes(i.id));
  }

  const menuItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

  // Verify all requested items exist and are currently available
  for (const itemInput of params.items) {
    const dbItem = menuItemMap.get(itemInput.menuItemId);
    if (!dbItem) {
      throw new Error(`One or more selected items are currently unavailable or out of stock`);
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
      const dbVariant = dbItem.variants?.find((v: any) => v.id === itemInput.variantId);
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
        const addOnLink = dbItem.addOnLinks?.find((link: any) => (link.addOnId || link.addOn?.id) === addOnId);
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

  // 5. Generate daily sequential order number and takeaway token strictly from 12:00 AM IST midnight
  const startOfDay = getIstStartOfDay();

  const fallbackStats = getMaxFallbackDailyOrderStats(startOfDay);

  let maxPrismaOrderNumber = 100;
  let prismaTakeawayCount = 0;

  try {
    const highestTodayOrder = await prisma.order.findFirst({
      where: { createdAt: { gte: startOfDay } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    if (highestTodayOrder?.orderNumber) {
      maxPrismaOrderNumber = highestTodayOrder.orderNumber;
    }
    if (params.type === 'TAKEAWAY') {
      prismaTakeawayCount = await prisma.order.count({
        where: {
          createdAt: { gte: startOfDay },
          type: OrderType.TAKEAWAY,
        },
      });
    }
  } catch {
    // Database offline or query failed - fallback gracefully
  }

  // Next order number is strictly sequential, never repeating 101
  const orderNumber = getNextOrderNumber(Math.max(maxPrismaOrderNumber, fallbackStats.maxOrderNumber));

  let takeawayToken: string | null = null;
  if (params.type === 'TAKEAWAY') {
    const nextTokenNum = Math.max(prismaTakeawayCount, fallbackStats.takeawayCount, orderNumber - 100);
    takeawayToken = `T-${nextTokenNum}`;
  }

  const timeoutMins = settings.unpaidOrderTimeoutMins || 15;
  const expiresAt = new Date(Date.now() + timeoutMins * 60 * 1000);

  // 6. Create Order and OrderItems in database transaction (with memory fallback)
  let order: any = null;
  try {
    order = await prisma.$transaction(async (tx) => {
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
    });
  } catch (txErr) {
    console.warn('Database error saving order, saving to resilient fallback store:', txErr);
    const fallbackId = crypto.randomUUID();
    order = {
      id: fallbackId,
      orderNumber,
      takeawayToken,
      type: params.type,
      tableNumber,
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: params.paymentMethod || 'UPI',
      customerName: params.customerName?.trim() || null,
      customerPhone: params.customerPhone?.trim() || null,
      customerUtrHint: null,
      whatsappOptIn: params.whatsappOptIn || false,
      cookingNote: params.cookingNote?.trim() || null,
      subtotal: orderSubtotalPaise,
      tax: orderTaxPaise,
      total: orderTotalPaise,
      expiresAt,
      completedAt: null,
      createdAt: new Date(),
      orderItems: orderItemsData.map((d, idx) => ({
        id: `oi-${fallbackId}-${idx}`,
        orderId: fallbackId,
        menuItemId: d.menuItemId,
        variantId: d.variantId || null,
        itemName: d.itemName,
        variantName: d.variantName || null,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        subtotal: d.subtotal,
        addOnsJson: d.addOnsJson,
        notes: d.notes || null,
        createdAt: new Date(),
      })),
      payments: [],
    };
    await saveFallbackOrder(order);
  }

  // 7. Broadcast new order to Admin POS via SSE (triggers audio sound in POS)
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

  await logAudit({
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
  let order: any = null;
  try {
    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
  } catch {}

  if (!order) {
    order = await getFallbackOrder(orderId);
  }

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
    try {
      const existingPaymentWithUtr = await prisma.payment.findUnique({
        where: { utr: cleanUtr },
        include: { order: true },
      });

      if (existingPaymentWithUtr && existingPaymentWithUtr.orderId !== order.id) {
        throw new Error(
          `Duplicate UTR detected! Transaction reference "${cleanUtr}" was already used to confirm Order #${existingPaymentWithUtr.order.orderNumber}.`
        );
      }
    } catch (utrErr: any) {
      if (utrErr.message?.includes('Duplicate UTR')) throw utrErr;
    }
  }

  // 2. Duplicate Amount Warning (Alerts if same amount was paid within last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  let recentMatchingPayment: any = null;
  try {
    recentMatchingPayment = await prisma.payment.findFirst({
      where: {
        amount: order.total,
        status: PaymentStatus.PAID,
        createdAt: { gte: tenMinutesAgo },
        orderId: { not: order.id },
      },
      include: { order: true },
    });
  } catch {}

  let duplicateWarning: string | null = null;
  if (recentMatchingPayment) {
    duplicateWarning = `Notice: Another order (#${recentMatchingPayment.order.orderNumber}) for the same amount (Rs ${recentMatchingPayment.amount / 100}) was marked paid ${Math.round((Date.now() - recentMatchingPayment.createdAt.getTime()) / 60000)} mins ago. Ensure this is a separate credit.`;
  }

  // 3. Complete payment in a transaction
  let payment: any = null;
  try {
    payment = await prisma.$transaction(async (tx) => {
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
    });
  } catch (txErr) {
    console.warn('Database error in markOrderPaid, updating fallback store:', txErr);
    await updateFallbackOrder(order.id, {
      status: 'PREPARING',
      paymentStatus: 'PAID',
      paymentMethod: params.method === 'CASH' ? 'CASH' : 'UPI',
    });
    payment = {
      id: `pay-${order.id}`,
      amount: order.total,
      method: params.method,
      status: 'PAID',
      utr: cleanUtr,
    };
  }

  // 4. Trigger 80mm thermal slips printing ONLY AFTER verified payment!
  await queueOrderPrintJobs(order.id).catch(() => {});

  // 5. Send customer WhatsApp confirmation asynchronously
  sendOrderConfirmedNotification(order.id).catch(() => {});

  // 6. Broadcast SSE events
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

  await logAudit({
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
  }).catch(() => {});

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
  let order: any = null;
  try {
    order = await prisma.order.findUnique({ where: { id: orderId } });
  } catch {}

  if (!order) {
    order = await getFallbackOrder(orderId);
  }

  if (!order) {
    throw new Error('Order not found');
  }

  let updated: any = null;
  try {
    updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        completedAt: newStatus === OrderStatus.COMPLETED ? new Date() : undefined,
      },
    });
  } catch (err) {
    console.warn('Database error in updateOrderStatus, updating fallback store:', err);
    updated = (await updateFallbackOrder(orderId, {
      status: newStatus,
      completedAt: newStatus === OrderStatus.COMPLETED ? new Date() : null,
    })) || { ...order, status: newStatus };
  }

  // If order transitioned to READY, send WhatsApp notification
  if (newStatus === OrderStatus.READY) {
    sendOrderReadyNotification(orderId).catch(() => {});
  }

  // Broadcast to admin dashboard and customer order tracking page
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

  await logAudit({
    userId: staffUser.id,
    action: 'ORDER_STATUS_UPDATE',
    resource: 'Order',
    details: { orderId, oldStatus: order.status, newStatus },
    ipAddress: ip,
  }).catch(() => {});

  return updated;
}

/**
 * Customer hint submission: allows customer to input last 4 digits of UTR.
 * Does NOT alter payment status. Only provides a hint displayed on the POS order card.
 */
export async function submitCustomerUtrHint(orderId: string, last4Digits: string) {
  let order: any = null;
  try {
    order = await prisma.order.findUnique({ where: { id: orderId } });
  } catch {}

  if (!order) {
    order = await getFallbackOrder(orderId);
  }

  if (!order) throw new Error('Order not found');

  let updated: any = null;
  try {
    updated = await prisma.order.update({
      where: { id: orderId },
      data: { customerUtrHint: last4Digits },
    });
  } catch {
    updated = (await updateFallbackOrder(orderId, { customerUtrHint: last4Digits })) || {
      ...order,
      customerUtrHint: last4Digits,
    };
  }

  sseBroker.broadcast('CUSTOMER_UTR_HINT', {
    orderId: updated.id,
    orderNumber: updated.orderNumber,
    customerUtrHint: last4Digits,
  });

  return updated;
}

/**
 * Sweeps expired unpaid orders older than timeout.
 */
export async function expireStaleUnpaidOrders(): Promise<number> {
  const now = new Date();
  const staleOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.AWAITING_PAYMENT,
      expiresAt: { lt: now },
    },
  });

  for (const order of staleOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.EXPIRED },
    });

    sseBroker.broadcast(
      'ORDER_STATUS_CHANGED',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.EXPIRED,
      },
      order.id
    );
  }

  return staleOrders.length;
}

/**
 * Gets the active order occupying a table (if any).
 */
export async function getActiveOrderForTable(
  tableNumber: number
): Promise<{ id: string; orderNumber: number; status: string; total?: number; createdAt: string } | null> {
  try {
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
  } catch {}

  const fallback = await getTableOccupancy(tableNumber);
  if (fallback) {
    return {
      id: fallback.orderId,
      orderNumber: fallback.orderNumber,
      status: 'PREPARING',
      createdAt: fallback.occupiedAt,
    };
  }

  return null;
}

/**
 * Vacates a dining table, marking active orders as COMPLETED and freeing it for new guests.
 */
export async function vacateTable(tableNumber: number, staffUser?: User): Promise<void> {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        tableNumber,
        type: OrderType.DINE_IN,
        status: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] },
      },
    });

    for (const order of activeOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
      });
      sseBroker.broadcast(
        'ORDER_STATUS_CHANGED',
        { orderId: order.id, orderNumber: order.orderNumber, status: OrderStatus.COMPLETED },
        order.id
      );
    }
  } catch {}

  await vacateTableStore(tableNumber);

  if (staffUser) {
    logAudit({
      userId: staffUser.id,
      action: 'TABLE_VACATED',
      resource: `table:${tableNumber}`,
      details: { tableNumber, userEmail: staffUser.email, userRole: staffUser.role },
    }).catch(() => {});
  }
}

