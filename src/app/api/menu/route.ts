import { NextRequest, NextResponse } from 'next/server';
import { getPublicMenu, upsertMenuItem } from '@/server/services/menuService';
import { requireAuth } from '@/lib/auth/session';
import { menuItemInputSchema } from '@/lib/validation/schemas';
import { Role } from '@prisma/client';

export async function GET() {
  const categories = await getPublicMenu();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  
  let user;
  try {
    user = await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = menuItemInputSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const item = await upsertMenuItem(parseResult.data, user.id, ip);
  return NextResponse.json({ success: true, item });
}
