import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/db';
import { createOrder, markOrderPaid } from '@/server/services/orderService';
import { signTableToken } from '@/lib/security/hmac';
import { Role, User } from '@prisma/client';

describe('Payment Security & Fraud Defenses', () => {
  let staffUser: User;
  let testItemId: string;
  let tableToken: string;

  beforeAll(async () => {
    staffUser = await prisma.user.findFirstOrThrow({
      where: { email: 'staff@wrapnation.com' },
    });

    const item = await prisma.menuItem.findFirstOrThrow({
      where: { name: 'Chicken Wrap' },
    });
    testItemId = item.id;
    tableToken = signTableToken(2);
  });

  it('unpaid order remains in AWAITING_PAYMENT and creates ZERO print jobs', async () => {
    const order = await createOrder({
      type: 'DINE_IN',
      tableToken,
      paymentMethod: 'UPI',
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      items: [{ menuItemId: testItemId, addOnIds: [], quantity: 1 }],
    });

    expect(order.status).toBe('AWAITING_PAYMENT');
    expect(order.paymentStatus).toBe('PENDING');

    // Verify no print jobs exist for this unpaid order
    const printJobs = await prisma.printJob.findMany({
      where: { orderId: order.id },
    });
    expect(printJobs).toHaveLength(0);
  });

  it('queues kitchen slip and customer bill ONLY AFTER staff marks order as PAID', async () => {
    const order = await createOrder({
      type: 'DINE_IN',
      tableToken,
      paymentMethod: 'UPI',
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      items: [{ menuItemId: testItemId, addOnIds: [], quantity: 1 }],
    });

    // Staff confirms payment
    const result = await markOrderPaid(
      order.id,
      { method: 'UPI', utr: `UTR_${Date.now()}` },
      staffUser
    );

    expect(result.success).toBe(true);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updatedOrder?.status).toBe('PREPARING');
    expect(updatedOrder?.paymentStatus).toBe('PAID');

    // Customer Bill should now be queued
    const printJobs = await prisma.printJob.findMany({
      where: { orderId: order.id },
    });
    expect(printJobs.length).toBeGreaterThanOrEqual(1);
    expect(printJobs[0].slipType).toBe('CUSTOMER_BILL');
  }, 60000);

  it('rejects duplicate UTR transaction reference across two separate orders', async () => {
    const uniqueUtr = `REPLAY_UTR_${Date.now()}`;

    // Order 1
    const order1 = await createOrder({
      type: 'DINE_IN',
      tableToken,
      paymentMethod: 'UPI',
      customerName: 'Customer One',
      customerPhone: '9876543210',
      items: [{ menuItemId: testItemId, addOnIds: [], quantity: 1 }],
    });

    await markOrderPaid(order1.id, { method: 'UPI', utr: uniqueUtr }, staffUser);

    // Order 2
    const order2 = await createOrder({
      type: 'DINE_IN',
      tableToken,
      paymentMethod: 'UPI',
      customerName: 'Customer Two',
      customerPhone: '9876543210',
      items: [{ menuItemId: testItemId, addOnIds: [], quantity: 1 }],
    });

    // Malicious customer or mistake: attempting to reuse same UTR to confirm second order
    await expect(
      markOrderPaid(order2.id, { method: 'UPI', utr: uniqueUtr }, staffUser)
    ).rejects.toThrow(/Duplicate UTR detected/);
  }, 60000);
});
