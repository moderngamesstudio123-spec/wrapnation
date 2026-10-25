import { NextRequest, NextResponse } from 'next/server';
import { updateUpiSettings, getSettings } from '@/server/services/settingService';
import { requireAuth } from '@/lib/auth/session';
import { updateUpiSettingsSchema } from '@/lib/validation/schemas';
import { Role } from '@prisma/client';

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
  const parseResult = updateUpiSettingsSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateUpiSettings(parseResult.data, ownerUser.id, ip);

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to update UPI settings' }, { status: 400 });
  }

  const settings = await getSettings();
  return NextResponse.json({
    success: true,
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    upiQrUrl: settings.upiQrUrl,
  });
}
