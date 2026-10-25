import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PrintJobStatus } from '@prisma/client';
import crypto from 'crypto';

function verifyPrinterKey(req: NextRequest): boolean {
  const providedKey = req.headers.get('x-printer-key') || '';
  const expectedKey = process.env.PRINTER_AGENT_RAW_KEY || '';

  if (!providedKey || !expectedKey) return false;

  const providedBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function GET(req: NextRequest) {
  if (!verifyPrinterKey(req)) {
    return NextResponse.json({ error: 'Unauthorized printer agent' }, { status: 401 });
  }

  // Fetch oldest pending print jobs
  const pendingJobs = await prisma.printJob.findMany({
    where: {
      status: PrintJobStatus.PENDING,
      attempts: { lt: 5 }, // max 5 retry attempts
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  return NextResponse.json({ jobs: pendingJobs });
}
