import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/argon';
import { createSession, setSessionCookie, DEFAULT_OWNER, DEFAULT_STAFF } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';
import { logAudit } from '@/server/services/auditService';
import { Role, User } from '@prisma/client';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // 1. Rate limiting on login endpoint (10 attempts per minute per IP)
  const rateLimitKey = `login:${ip}`;
  const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60000, maxRequests: 10 });

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
  const normalizedEmail = email.toLowerCase().trim();
  const isDefaultOwner = normalizedEmail === 'owner@wrapnation.com' && password === 'Owner@123456';
  const isDefaultStaff = normalizedEmail === 'staff@wrapnation.com' && password === 'Staff@123456';

  let user: User | null = null;
  let dbError = false;

  // 3. Find user in database
  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (err) {
    dbError = true;
    console.warn('Database connection error in login:', err);
  }

  // 4. If user not in DB but default credentials provided: Auto-seed or use Fallback User
  if (!user && (isDefaultOwner || isDefaultStaff)) {
    const targetRole = isDefaultOwner ? Role.OWNER : Role.STAFF;
    const targetName = isDefaultOwner ? 'Shop Owner (Admin)' : 'Counter Staff';

    if (!dbError) {
      try {
        const passwordHash = await hashPassword(password);
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: targetName,
            role: targetRole,
            passwordHash,
          },
        });
      } catch (seedErr) {
        console.warn('Could not auto-seed user to DB:', seedErr);
      }
    }

    if (!user) {
      user = isDefaultOwner ? DEFAULT_OWNER : DEFAULT_STAFF;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // 5. Check account lockout status if in DB
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Account is temporarily locked. Try again in ${remainingMins} minutes.` },
      { status: 423 }
    );
  }

  // 6. Verify password (if stored with hash)
  if (user.passwordHash) {
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const updatedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutDate: Date | null = null;
      if (updatedAttempts >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: updatedAttempts,
          lockoutUntil: lockoutDate,
        },
      }).catch(() => {});

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
  } else if (!isDefaultOwner && !isDefaultStaff) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // 7. Reset failed attempts
  if (user.id !== DEFAULT_OWNER.id && user.id !== DEFAULT_STAFF.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    }).catch(() => {});
  }

  resetRateLimit(rateLimitKey);

  // 8. Create session & set cookie
  const rawToken = await createSession(user.id, user.role);
  await setSessionCookie(rawToken);

  logAudit({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resource: 'User',
    details: { email: user.email, role: user.role },
    ipAddress: ip,
    userAgent,
  }).catch(() => {});

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
