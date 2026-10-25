import { NextRequest, NextResponse } from 'next/server';
import { triggerReprint } from '@/server/services/printerService';
import { requireAuth } from '@/lib/auth/session';
import { logAudit } from '@/server/services/auditService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let staffUser;
  try {
    staffUser = await requireAuth();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const slipType = body?.slipType as 'KITCHEN' | 'CUSTOMER_BILL' | undefined;

  const result = await triggerReprint(id, slipType);

  await logAudit({
    userId: staffUser.id,
    action: 'ORDER_REPRINT_REQUESTED',
    resource: 'PrintJob',
    details: { orderId: id, slipType },
    ipAddress: ip,
  });

  return NextResponse.json(result);
}
