import prisma from '@/lib/db';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  resource: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an immutable audit log entry in the database.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
  }
}
