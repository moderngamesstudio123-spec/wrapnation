import { NextRequest, NextResponse } from 'next/server';
import { getDailyReport } from '@/server/services/reportService';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(Role.OWNER);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNAUTHORIZED';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const report = await getDailyReport(targetDate);
  return NextResponse.json({ report });
}
