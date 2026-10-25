import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { signTableToken } from '@/lib/security/hmac';
import { getSettings } from '@/server/services/settingService';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // STAFF or OWNER
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();
  const tablesCount = settings.tablesCount || 12;

  // Derive origin from request URL or configured APP_URL
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const tables: Array<{
    tableNumber: number;
    signedToken: string;
    orderUrl: string;
    qrDataUrl: string;
  }> = [];

  for (let i = 1; i <= tablesCount; i++) {
    const signedToken = signTableToken(i);
    const orderUrl = `${origin}/t/${signedToken}`;
    
    // Generate high resolution QR code data URL
    const qrDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    tables.push({
      tableNumber: i,
      signedToken,
      orderUrl,
      qrDataUrl,
    });
  }

  // Also include takeaway QR
  const takeawayUrl = `${origin}/takeaway`;
  const takeawayQrDataUrl = await QRCode.toDataURL(takeawayUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return NextResponse.json({
    shopName: settings.shopName,
    tables,
    takeaway: {
      orderUrl: takeawayUrl,
      qrDataUrl: takeawayQrDataUrl,
    },
  });
}
