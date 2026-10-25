import prisma from '@/lib/db';
import { WhatsAppProvider } from '@/lib/whatsapp/provider';
import { MockWhatsAppProvider } from '@/lib/whatsapp/mock-provider';
import { MetaWhatsAppProvider } from '@/lib/whatsapp/meta-provider';
import { MessageStatus } from '@prisma/client';

function getWhatsAppProvider(): WhatsAppProvider {
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  const token = process.env.META_WA_ACCESS_TOKEN;

  if (phoneId && token) {
    return new MetaWhatsAppProvider(phoneId, token);
  }

  return new MockWhatsAppProvider();
}

/**
 * Sends order confirmed message asynchronously.
 * Respects customer opt-in consent. Never blocks the calling process.
 */
export async function sendOrderConfirmedNotification(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.customerPhone || !order.whatsappOptIn) {
    return;
  }

  const provider = getWhatsAppProvider();
  const templateName = 'wrapnation_order_confirmed';
  const orderLabel = order.type === 'TAKEAWAY' && order.takeawayToken ? order.takeawayToken : `#${order.orderNumber}`;

  const messageLog = await prisma.messageLog.create({
    data: {
      orderId: order.id,
      recipientPhone: order.customerPhone,
      templateName,
      payload: JSON.stringify({ orderLabel, customerName: order.customerName || 'Customer' }),
      status: MessageStatus.PENDING,
    },
  });

  // Run in background without awaiting blocking response
  provider
    .sendTemplate({
      toPhone: order.customerPhone,
      templateName,
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: orderLabel },
      ],
    })
    .then(async (result) => {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: result.success ? MessageStatus.SENT : MessageStatus.FAILED,
          error: result.error || null,
          sentAt: result.success ? new Date() : null,
        },
      });
    })
    .catch(async (err) => {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: MessageStatus.FAILED,
          error: String(err),
        },
      });
    });
}

/**
 * Sends order ready message to customer.
 */
export async function sendOrderReadyNotification(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.customerPhone || !order.whatsappOptIn) {
    return;
  }

  const provider = getWhatsAppProvider();
  const templateName = 'wrapnation_order_ready';
  const orderLabel = order.type === 'TAKEAWAY' && order.takeawayToken ? order.takeawayToken : `#${order.orderNumber}`;

  const messageLog = await prisma.messageLog.create({
    data: {
      orderId: order.id,
      recipientPhone: order.customerPhone,
      templateName,
      payload: JSON.stringify({ orderLabel }),
      status: MessageStatus.PENDING,
    },
  });

  provider
    .sendTemplate({
      toPhone: order.customerPhone,
      templateName,
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: orderLabel },
      ],
    })
    .then(async (result) => {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: result.success ? MessageStatus.SENT : MessageStatus.FAILED,
          error: result.error || null,
          sentAt: result.success ? new Date() : null,
        },
      });
    })
    .catch(async (err) => {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: MessageStatus.FAILED,
          error: String(err),
        },
      });
    });
}
