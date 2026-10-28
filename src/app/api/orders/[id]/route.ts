import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSettings } from '@/server/services/settingService';
import { formatPaise } from '@/lib/format';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let order: any = null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        payments: { where: { status: 'PAID' }, take: 1 },
      },
    });
  } catch (err) {
    console.error('[GET /api/orders/[id]] Database connection error:', err);
    return NextResponse.json(
      { error: 'Service temporarily unavailable, please try again' },
      { status: 503 }
    );
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const settings = await getSettings();

  // If order is awaiting payment and method is UPI, construct prefilled UPI deep link & QR
  let upiPaymentData: {
    upiId: string;
    payeeName: string;
    deepLink: string;
    qrDataUrl: string;
    amountFormatted: string;
  } | null = null;

  if (order.status === 'AWAITING_PAYMENT' && order.paymentMethod === 'UPI') {
    const amountRupees = (order.total / 100).toFixed(2);
    const deepLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.payeeName)}&am=${amountRupees}&tn=Order_${order.orderNumber}&cu=INR`;

    let qrDataUrl = settings.upiQrUrl;
    if (!qrDataUrl) {
      // Generate clean QR data URL containing the UPI deep link
      try {
        qrDataUrl = await QRCode.toDataURL(deepLink, {
          width: 320,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      } catch (err) {
        console.error('Failed to generate UPI QR:', err);
      }
    }

    upiPaymentData = {
      upiId: settings.upiId,
      payeeName: settings.payeeName,
      deepLink,
      qrDataUrl,
      amountFormatted: formatPaise(order.total),
    };
  }

  return NextResponse.json({
    order: {
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
      subtotalFormatted: formatPaise(order.subtotal),
      taxFormatted: formatPaise(order.tax),
      totalFormatted: formatPaise(order.total),
      expiresAt: order.expiresAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
      orderItems: (order.orderItems || []).map((item: any) => {
        let addOns = Array.isArray(item.addOns) ? item.addOns : [];
        if (!addOns.length && item.addOnsJson) {
          try {
            addOns = JSON.parse(item.addOnsJson);
          } catch {}
        }
        return {
          id: item.id,
          itemName: item.itemName,
          variantName: item.variantName || null,
          unitPrice: item.unitPrice,
          unitPriceFormatted: formatPaise(item.unitPrice),
          quantity: item.quantity,
          subtotal: item.subtotal,
          subtotalFormatted: formatPaise(item.subtotal),
          addOns,
          notes: item.notes || null,
        };
      }),
      payment: order.payments?.[0] || null,
    },
    upiPaymentData,
    shop: {
      name: settings.shopName,
      address: settings.shopAddress,
      phone: settings.shopPhone,
      gstin: settings.gstEnabled && settings.gstin ? settings.gstin : null,
    },
  });
}
