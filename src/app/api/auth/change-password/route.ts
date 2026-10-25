import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { verifyPassword, hashPassword } from '@/lib/auth/argon';
import { changePasswordSchema } from '@/lib/validation/schemas';
import { logAudit } from '@/server/services/auditService';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = changePasswordSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parseResult.data;

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'PASSWORD_CHANGED',
    resource: 'User',
    details: { email: user.email },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
