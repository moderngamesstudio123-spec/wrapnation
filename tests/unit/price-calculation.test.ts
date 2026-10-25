import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/db';
import { createOrder } from '@/server/services/orderService';
import { signTableToken } from '@/lib/security/hmac';

describe('Security & Business Logic Integrity: Server-Side Price Calculation', () => {
  let chickenWrapId: string;
  let comboVariantId: string;
  let extraCheeseAddOnId: string;
  let tableToken: string;

  beforeAll(async () => {
    // Fetch seeded Chicken Wrap
    const wrap = await prisma.menuItem.findFirst({
      where: { name: 'Chicken Wrap' },
      include: {
        variants: true,
        addOnLinks: { include: { addOn: true } },
      },
    });

    if (!wrap) throw new Error('Seeded Chicken Wrap not found');
    chickenWrapId = wrap.id;
    comboVariantId = wrap.variants[0].id;
    extraCheeseAddOnId = wrap.addOnLinks.find((l) => l.addOn.name === 'Extra Cheese')!.addOnId;
    tableToken = signTableToken(1);
  });

  it('calculates the exact database amount regardless of any client tampering', async () => {
    // Chicken Wrap base = 13000 paise (Rs 130)
    // Combo variant = +6000 paise (Rs 60)
    // Extra Cheese = +1000 paise (Rs 10)
    // Quantity = 2
    // Expected unit price = 13000 + 6000 + 1000 = 20000 paise (Rs 200)
    // Expected subtotal = 20000 * 2 = 40000 paise (Rs 400)

    const order = await createOrder({
      type: 'DINE_IN',
      tableToken,
      paymentMethod: 'UPI',
      items: [
        {
          menuItemId: chickenWrapId,
          variantId: comboVariantId,
          addOnIds: [extraCheeseAddOnId],
          quantity: 2,
        },
      ],
    });

    expect(order.subtotal).toBe(40000);
    expect(order.orderItems).toHaveLength(1);
    expect(order.orderItems[0].unitPrice).toBe(20000);
    expect(order.orderItems[0].quantity).toBe(2);
    expect(order.orderItems[0].subtotal).toBe(40000);
  });

  it('rejects order with invalid or tampered variant IDs', async () => {
    await expect(
      createOrder({
        type: 'DINE_IN',
        tableToken,
        items: [
          {
            menuItemId: chickenWrapId,
            variantId: '00000000-0000-0000-0000-000000000000',
            addOnIds: [],
            quantity: 1,
          },
        ],
      })
    ).rejects.toThrow();
  });
});
