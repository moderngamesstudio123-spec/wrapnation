import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, destroySession, clearSessionCookie, getCurrentUser } from '@/lib/auth/session';
import { logAudit } from '@/server/services/auditService';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (user) {
    await logAudit({
      userId: user.id,
      action: 'LOGOUT',
      resource: 'User',
      details: { email: user.email },
      ipAddress: ip,
    });
  }

  await destroySession(rawToken);
  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
