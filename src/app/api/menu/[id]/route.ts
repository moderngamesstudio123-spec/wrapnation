import { NextRequest, NextResponse } from 'next/server';
import { upsertMenuItem } from '@/server/services/menuService';
import { requireAuth } from '@/lib/auth/session';
import { menuItemInputSchema } from '@/lib/validation/schemas';
import prisma from '@/lib/db';
import { logAudit } from '@/server/services/auditService';
import { Role } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const item = await upsertMenuItem({ ...parseResult.data, id }, user.id, ip);
  return NextResponse.json({ success: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let user;
  try {
    user = await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const item = await prisma.menuItem.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: 'MENU_ITEM_DELETE',
    resource: 'MenuItem',
    details: { id, name: item.name },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}
