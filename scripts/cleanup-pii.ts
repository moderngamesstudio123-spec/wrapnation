import prisma from '../src/lib/db';

async function cleanupPii() {
  console.log('[PII Cleanup] Starting 90-day data retention cleanup...');
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const result = await prisma.order.updateMany({
    where: {
      createdAt: { lt: ninetyDaysAgo },
      OR: [
        { customerPhone: { not: null } },
        { customerName: { not: null } },
        { cookingNote: { not: null } },
      ],
    },
    data: {
      customerPhone: null,
      customerName: 'Anonymized Customer',
      cookingNote: null,
      customerUtrHint: null,
    },
  });

  console.log(`[PII Cleanup] Anonymized ${result.count} orders older than 90 days.`);
}

cleanupPii()
  .catch((err) => {
    console.error('[PII Cleanup] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
