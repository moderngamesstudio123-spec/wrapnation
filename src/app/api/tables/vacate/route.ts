import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { vacateTable } from '@/server/services/orderService';
import { z } from 'zod';

const vacateSchema = z.object({
  tableNumber: z.number().int().positive().max(100),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = vacateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid table number' }, { status: 400 });
  }

  try {
    await vacateTable(parsed.data.tableNumber, user as any);
    return NextResponse.json({
      success: true,
      message: `Table #${parsed.data.tableNumber} is now vacant and available for new guests.`,
      tableNumber: parsed.data.tableNumber,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to vacate table';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
