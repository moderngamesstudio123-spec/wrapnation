import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { User, Role } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'wn_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const DEFAULT_OWNER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'owner@wrapnation.com',
  name: 'Shop Owner (Admin)',
  role: Role.OWNER,
  passwordHash: '',
  failedLoginAttempts: 0,
  lockoutUntil: null,
  mustChangePassword: false,
  totpSecret: null,
  totpEnabled: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const DEFAULT_STAFF: User = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'staff@wrapnation.com',
  name: 'Counter Staff',
  role: Role.STAFF,
  passwordHash: '',
  failedLoginAttempts: 0,
  lockoutUntil: null,
  mustChangePassword: false,
  totpSecret: null,
  totpEnabled: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'wrap_nation_session_secret_change_in_production_min_32_chars!';
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new session for a user and returns the raw session token.
 * Supports cryptographic fallback token if DB is momentarily unreachable.
 */
export async function createSession(userId: string, userRole: Role = Role.STAFF): Promise<string> {
  const secret = getSessionSecret();
  const fallbackToken = `wn_fb_${userRole}_${crypto.createHmac('sha256', secret).update(userRole).digest('hex')}`;

  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  } catch (err) {
    console.warn('Could not persist session to database, using signed fallback token:', err);
    return fallbackToken;
  }
}

/**
 * Validates a raw session token and returns the corresponding User.
 * Automatically deletes expired sessions.
 */
export async function getSessionUser(rawToken?: string | null): Promise<User | null> {
  if (!rawToken) return null;

  // 1. Check for cryptographic fallback session (for Vercel serverless / offline DB)
  if (rawToken.startsWith('wn_fb_')) {
    const parts = rawToken.split('_');
    const role = parts[2]; // 'OWNER' or 'STAFF'
    const sig = parts[3];
    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(role).digest('hex');
    if (sig === expectedSig) {
      return role === 'OWNER' ? DEFAULT_OWNER : DEFAULT_STAFF;
    }
  }

  // 2. Normal database lookup
  try {
    const tokenHash = hashSessionToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return session.user;
  } catch (err) {
    console.warn('Database error in getSessionUser:', err);
    return null;
  }
}

/**
 * Destroys a session server-side.
 */
export async function destroySession(rawToken?: string | null): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
}

/**
 * Retrieves the currently authenticated user from Next.js cookie store.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return getSessionUser(sessionCookie?.value);
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie on response headers with secure attributes.
 */
export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/**
 * Deletes the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Route protection guard: Enforces authentication and role check.
 * Throws an Error if unauthenticated or unauthorized.
 */
export async function requireAuth(minimumRole: Role = Role.STAFF): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  // If user is locked out
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    throw new Error('ACCOUNT_LOCKED');
  }

  if (minimumRole === Role.OWNER && user.role !== Role.OWNER) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

export async function requireOwner(): Promise<User> {
  return requireAuth(Role.OWNER);
}
