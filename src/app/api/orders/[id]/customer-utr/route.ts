import { NextRequest, NextResponse } from 'next/server';
import { submitCustomerUtrHint } from '@/server/services/orderService';
import { customerUtrHintSchema } from '@/lib/validation/schemas';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parseResult = customerUtrHintSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Please enter exactly the last 4 digits' }, { status: 400 });
  }

  try {
    const updated = await submitCustomerUtrHint(id, parseResult.data.last4Digits);
    return NextResponse.json({ success: true, hint: updated.customerUtrHint });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit hint';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
