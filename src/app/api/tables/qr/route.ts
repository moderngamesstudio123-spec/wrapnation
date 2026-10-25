import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { signTableToken } from '@/lib/security/hmac';
import { getSettings } from '@/server/services/settingService';
import QRCode from 'qrcode';

import os from 'os';

function getLocalIp(): string {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {}
  return 'localhost';
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // STAFF or OWNER
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();
  const tablesCount = settings.tablesCount || 12;

  // Derive origin: if localhost on local machine, substitute real local Wi-Fi IP so phones can scan & reach it!
  let origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    const localIp = getLocalIp();
    if (localIp !== 'localhost') {
      origin = origin.replace('localhost', localIp).replace('127.0.0.1', localIp);
    }
  }

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
