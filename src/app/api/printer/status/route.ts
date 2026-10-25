import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { sseBroker } from '@/lib/sse/broker';

let lastPrinterHeartbeat: {
  timestamp: Date;
  status: 'ONLINE' | 'OFFLINE';
  printerConnected: boolean;
  paperStatus: string;
} = {
  timestamp: new Date(0),
  status: 'OFFLINE',
  printerConnected: false,
  paperStatus: 'UNKNOWN',
};

function verifyPrinterKey(req: NextRequest): boolean {
  const providedKey = req.headers.get('x-printer-key') || '';
  const expectedKey = process.env.PRINTER_AGENT_RAW_KEY || '';

  if (!providedKey || !expectedKey) return false;

  const providedBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  if (!verifyPrinterKey(req)) {
    return NextResponse.json({ error: 'Unauthorized printer agent' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  lastPrinterHeartbeat = {
    timestamp: new Date(),
    status: 'ONLINE',
    printerConnected: body.printerConnected !== false,
    paperStatus: body.paperStatus || 'OK',
  };

  sseBroker.broadcast('PRINTER_STATUS_UPDATE', lastPrinterHeartbeat);

  return NextResponse.json({ success: true, acknowledged: true });
}

export async function GET() {
  const now = Date.now();
  const isRecent = now - lastPrinterHeartbeat.timestamp.getTime() < 30000; // seen within 30s

  const pendingCount = await prisma.printJob.count({
    where: { status: 'PENDING' },
  });

  return NextResponse.json({
    online: isRecent && lastPrinterHeartbeat.printerConnected,
    lastSeen: lastPrinterHeartbeat.timestamp.toISOString(),
    paperStatus: lastPrinterHeartbeat.paperStatus,
    pendingJobs: pendingCount,
  });
}
