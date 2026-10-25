import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PrintJobStatus } from '@prisma/client';
import crypto from 'crypto';
import { z } from 'zod';
import { sseBroker } from '@/lib/sse/broker';

function verifyPrinterKey(req: NextRequest): boolean {
  const providedKey = req.headers.get('x-printer-key') || '';
  const expectedKey = process.env.PRINTER_AGENT_RAW_KEY || '';

  if (!providedKey || !expectedKey) return false;

  const providedBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

const ackSchema = z.object({
  jobId: z.string().uuid(),
  success: z.boolean(),
  error: z.string().optional().nullable(),
}).strict();

export async function POST(req: NextRequest) {
  if (!verifyPrinterKey(req)) {
    return NextResponse.json({ error: 'Unauthorized printer agent' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = ackSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { jobId, success, error } = parseResult.data;

  const existingJob = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!existingJob) {
    return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
  }

  const updatedJob = await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: success ? PrintJobStatus.PRINTED : PrintJobStatus.FAILED,
      attempts: { increment: 1 },
      lastError: error || null,
      printedAt: success ? new Date() : null,
    },
  });

  sseBroker.broadcast('PRINTER_JOB_ACK', {
    jobId: updatedJob.id,
    orderId: updatedJob.orderId,
    status: updatedJob.status,
  });

  return NextResponse.json({ success: true, job: updatedJob });
}
