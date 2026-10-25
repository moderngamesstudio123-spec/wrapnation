import { NextRequest, NextResponse } from 'next/server';
import { toggleItemStock } from '@/server/services/menuService';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';
import { sseBroker } from '@/lib/sse/broker';

const toggleStockSchema = z.object({
  itemId: z.string().uuid(),
  isAvailable: z.boolean(),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let user;
  try {
    user = await requireAuth(); // STAFF or OWNER
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = toggleStockSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const item = await toggleItemStock(
    parseResult.data.itemId,
    parseResult.data.isAvailable,
    user.id,
    ip
  );

  // Broadcast stock update via SSE so live customer menus and POS dashboards reflect immediately
  sseBroker.broadcast('MENU_STOCK_CHANGED', {
    itemId: item.id,
    name: item.name,
    isAvailable: item.isAvailable,
  });

  return NextResponse.json({ success: true, item });
}
