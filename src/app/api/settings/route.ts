import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateShopSettings } from '@/server/services/settingService';
import { requireAuth } from '@/lib/auth/session';
import { updateShopSettingsSchema } from '@/lib/validation/schemas';
import { Role } from '@prisma/client';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let ownerUser;
  try {
    ownerUser = await requireAuth(Role.OWNER);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = updateShopSettingsSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  await updateShopSettings(parseResult.data, ownerUser.id, ip);
  const updatedSettings = await getSettings();

  return NextResponse.json({ success: true, settings: updatedSettings });
}
