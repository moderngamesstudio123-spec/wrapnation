import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/argon';
import { signTableToken } from '../src/lib/security/hmac';
import { DEFAULT_CATEGORIES, DEFAULT_ADDONS } from '../src/server/services/defaultMenu';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Wrap Nation database...');

  // 1. Seed Shop Settings
  const defaultSettings: Record<string, string> = {
    shop_name: 'Wrap Nation',
    shop_address: '8-4, 549/48, AG Colony Rd, Erragadda, Hyderabad, Telangana 500038',
    shop_phone: '+91 81250 57086',
    gst_enabled: 'false',
    gstin: '',
    gst_percentage: '5',
    currency: 'INR',
    opening_time: '11:00',
    closing_time: '01:00',
    tables_count: '12',
    unpaid_order_timeout_mins: '15',
    upi_id: 'wrapnation@okaxis',
    payee_name: 'Wrap Nation Fast Food',
    upi_qr_url: '',
    printer_paper_width: '80',
    printer_enabled: 'true',
    google_maps_url: 'https://share.google/K02BROH8ES5iuiEmh',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log('Shop settings seeded.');

  // 2. Seed Demo Staff and Owner Accounts
  const ownerPasswordHash = await hashPassword('Owner@123456');
  const staffPasswordHash = await hashPassword('Staff@123456');

  await prisma.user.upsert({
    where: { email: 'owner@wrapnation.com' },
    update: {},
    create: {
      email: 'owner@wrapnation.com',
      name: 'Shop Owner (Admin)',
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@wrapnation.com' },
    update: {},
    create: {
      email: 'staff@wrapnation.com',
      name: 'Counter Staff',
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      mustChangePassword: false,
    },
  });
  console.log('Demo accounts seeded (owner@wrapnation.com, staff@wrapnation.com).');

  // 3. Seed Add-ons
  const createdAddOnMap = new Map<string, string>();
  for (const item of DEFAULT_ADDONS) {
    const addOn = await prisma.addOn.upsert({
      where: { name: item.name },
      update: { price: item.price, isCustomPrice: item.isCustomPrice },
      create: { id: item.id, name: item.name, price: item.price, isCustomPrice: item.isCustomPrice },
    });
    createdAddOnMap.set(item.name, addOn.id);
  }
  console.log('Add-ons seeded.');

  // 4. Seed Categories, Menu Items & Variants with matching IDs
  for (const cat of DEFAULT_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { id: cat.id, name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });

    for (const item of cat.items) {
      await prisma.menuItem.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
          categoryId: category.id,
          imageUrl: item.imageUrl,
        },
        create: {
          id: item.id,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
          categoryId: category.id,
          imageUrl: item.imageUrl,
        },
      });

      // Variants
      if (item.variants && item.variants.length > 0) {
        for (const variant of item.variants) {
          await prisma.itemVariant.upsert({
            where: { id: variant.id },
            update: { name: variant.name, priceDelta: variant.priceDelta, isAvailable: variant.isAvailable },
            create: {
              id: variant.id,
              menuItemId: item.id,
              name: variant.name,
              priceDelta: variant.priceDelta,
              isAvailable: variant.isAvailable,
            },
          });
        }
      }

      // Add-ons links
      for (const addonId of createdAddOnMap.values()) {
        await prisma.menuItemAddOn.upsert({
          where: { menuItemId_addOnId: { menuItemId: item.id, addOnId: addonId } },
          update: {},
          create: { menuItemId: item.id, addOnId: addonId },
        });
      }
    }
  }
  console.log('Menu items, variants & add-ons seeded with synchronized UUIDs.');

  // 5. Seed Table QRs (Tables 1 to 12)
  for (let tableNum = 1; tableNum <= 12; tableNum++) {
    const signedToken = signTableToken(tableNum);
    await prisma.tableQR.upsert({
      where: { tableNumber: tableNum },
      update: { signedToken },
      create: { tableNumber: tableNum, signedToken },
    });
  }
  console.log('Tables 1 to 12 HMAC tokens seeded.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
