import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(Role.OWNER);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const body = await req.json().catch(() => null);
  const parseResult = createCategorySchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { name, sortOrder } = parseResult.data;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        sortOrder,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 });
  }
}

