import { NextRequest, NextResponse } from 'next/server';
import { markOrderPaid } from '@/server/services/orderService';
import { requireAuth } from '@/lib/auth/session';
import { markPaidSchema } from '@/lib/validation/schemas';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Enforce authenticated STAFF / OWNER role (Deny by default)
  let staffUser;
  try {
    staffUser = await requireAuth();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // 2. Validate input
  const body = await req.json().catch(() => null);
  const parseResult = markPaidSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await markOrderPaid(id, parseResult.data, staffUser, ip);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark order as paid';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
