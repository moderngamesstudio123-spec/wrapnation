import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth/argon';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';
import { logAudit } from '@/server/services/auditService';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // 1. Rate limiting on login endpoint (5 attempts per minute per IP)
  const rateLimitKey = `login:${ip}`;
  const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60000, maxRequests: 5 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a minute and try again.' },
      { status: 429, headers: { 'Retry-After': `${Math.ceil(rateLimit.resetMs / 1000)}` } }
    );
  }

  // 2. Validate input schema
  const body = await req.json().catch(() => null);
  const parseResult = loginSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parseResult.data;

  // 3. Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Avoid user enumeration: generic error message
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // 4. Check account lockout status
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
    await logAudit({
      userId: user.id,
      action: 'LOGIN_LOCKED_ATTEMPT',
      resource: 'User',
      details: { email, remainingMins },
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json(
      { error: `Account is temporarily locked due to repeated failed attempts. Try again in ${remainingMins} minutes.` },
      { status: 423 }
    );
  }

  // 5. Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    const updatedAttempts = user.failedLoginAttempts + 1;
    let lockoutDate: Date | null = null;

    if (updatedAttempts >= 5) {
      lockoutDate = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: updatedAttempts,
        lockoutUntil: lockoutDate,
      },
    });

    await logAudit({
      userId: user.id,
      action: lockoutDate ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      resource: 'User',
      details: { email, attempts: updatedAttempts, locked: !!lockoutDate },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // 6. Reset failed attempts and create session
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });

  resetRateLimit(rateLimitKey);

  const rawToken = await createSession(user.id);
  await setSessionCookie(rawToken);

  await logAudit({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resource: 'User',
    details: { email: user.email, role: user.role },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
}
