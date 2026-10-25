import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/server/services/orderService';
import { requireAuth } from '@/lib/auth/session';
import { updateOrderStatusSchema } from '@/lib/validation/schemas';
import { OrderStatus } from '@prisma/client';

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

  const body = await req.json().catch(() => null);
  const parseResult = updateOrderStatusSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  try {
    const updated = await updateOrderStatus(
      id,
      parseResult.data.status as OrderStatus,
      staffUser,
      ip
    );
    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
