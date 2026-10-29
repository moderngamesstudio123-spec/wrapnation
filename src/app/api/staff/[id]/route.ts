import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth/argon';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { z } from 'zod';

const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(['OWNER', 'STAFF']).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let currentUser;
  try {
    currentUser = await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = updateStaffSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parseResult.data;

  try {
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role as Role;
    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(password.trim());
      updateData.mustChangePassword = false;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Failed to update staff member:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let currentUser;
  try {
    currentUser = await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  // Prevent owner from deleting their own account
  if (currentUser.id === id) {
    return NextResponse.json(
      { error: 'Cannot delete your own active owner account' },
      { status: 400 }
    );
  }

  try {
    // Delete user sessions first to immediately revoke access
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete staff member:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}

