import prisma from '../src/lib/db';

async function main() {
  await prisma.setting.upsert({
    where: { key: 'shop_phone' },
    update: { value: '+91 86868 78675' },
    create: { key: 'shop_phone', value: '+91 86868 78675' },
  });
  console.log('Successfully updated shop_phone to +91 86868 78675 in database');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
