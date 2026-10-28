import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireOwner, createSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import prisma from '@/lib/db';

const mockCookieStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { value: val } : undefined;
    },
    set: (name: string, val: string) => mockCookieStore.set(name, val),
    delete: (name: string) => mockCookieStore.delete(name),
  })),
}));

describe('Security: RBAC Authorization & Deny-by-Default', () => {
  beforeEach(() => {
    mockCookieStore.clear();
  });

  it('throws UNAUTHORIZED when no user session exists', async () => {
    await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
    await expect(requireOwner()).rejects.toThrow('UNAUTHORIZED');
  });

  it('allows STAFF to access standard staff operations', async () => {
    const staff = await prisma.user.findFirstOrThrow({
      where: { role: Role.STAFF },
    });

    const token = await createSession(staff.id);
    mockCookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireAuth(Role.STAFF);
    expect(user.role).toBe(Role.STAFF);
    expect(user.id).toBe(staff.id);
  });

  it('prevents STAFF from accessing OWNER routes with FORBIDDEN exception', async () => {
    const staff = await prisma.user.findFirstOrThrow({
      where: { role: Role.STAFF },
    });

    const token = await createSession(staff.id);
    mockCookieStore.set(SESSION_COOKIE_NAME, token);

    await expect(requireOwner()).rejects.toThrow('FORBIDDEN');
  });

  it('allows OWNER to access owner operations', async () => {
    const owner = await prisma.user.findFirstOrThrow({
      where: { role: Role.OWNER },
    });

    const token = await createSession(owner.id);
    mockCookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireOwner();
    expect(user.role).toBe(Role.OWNER);
    expect(user.id).toBe(owner.id);
  });
});
