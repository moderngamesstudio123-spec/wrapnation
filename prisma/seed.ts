import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/argon';
import { signTableToken } from '../src/lib/security/hmac';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Wrap Nation database...');

  // 1. Seed Shop Settings
  const defaultSettings: Record<string, string> = {
    shop_name: 'Wrap Nation',
    shop_address: 'Shop 4, Ground Floor, Food Street, Indiranagar, Bengaluru, Karnataka 560038',
    shop_phone: '+91 86868 78675',
    gst_enabled: 'false',
    gstin: '',
    gst_percentage: '5',
    currency: 'INR',
    opening_time: '11:00',
    closing_time: '23:00',
    tables_count: '12',
    unpaid_order_timeout_mins: '15',
    upi_id: 'wrapnation@okaxis',
    payee_name: 'Wrap Nation Fast Food',
    upi_qr_url: '',
    printer_paper_width: '80',
    printer_enabled: 'true',
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
      mustChangePassword: true,
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
      mustChangePassword: true,
    },
  });
  console.log('Demo accounts seeded (owner@wrapnation.com, staff@wrapnation.com).');

  // 3. Seed Add-ons
  const addOnsData = [
    { name: 'Extra Mayonnaise', price: 1000, isCustomPrice: false }, // Rs 10
    { name: 'Extra Cheese', price: 1000, isCustomPrice: false },     // Rs 10
    { name: 'Cold Drink', price: 4000, isCustomPrice: true },        // Rs 40 (configurable in admin)
  ];

  const createdAddOns: Record<string, string> = {};
  for (const item of addOnsData) {
    const addOn = await prisma.addOn.upsert({
      where: { name: item.name },
      update: { price: item.price, isCustomPrice: item.isCustomPrice },
      create: { name: item.name, price: item.price, isCustomPrice: item.isCustomPrice },
    });
    createdAddOns[item.name] = addOn.id;
  }
  console.log('Add-ons seeded.');

  // 4. Seed Categories
  const categoriesData = [
    { name: 'Wraps', slug: 'wraps', sortOrder: 1 },
    { name: 'Burgers', slug: 'burgers', sortOrder: 2 },
    { name: 'Fried Chicken', slug: 'fried-chicken', sortOrder: 3 },
    { name: 'Snacks', slug: 'snacks', sortOrder: 4 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });
    createdCategories[cat.slug] = category.id;
  }
  console.log('Categories seeded.');

  // 5. Seed Menu Items
  // Wraps
  const wraps = [
    {
      name: 'Chicken Wrap',
      description: 'Juicy spiced grilled chicken rolled in soft warm flatbread with house sauces.',
      basePrice: 13000, // 130 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (190 total)
    },
    {
      name: 'Cheesy Chicken Wrap',
      description: 'Loaded with melted cheddar, succulent chicken pieces and signature seasoning.',
      basePrice: 14000, // 140 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (200 total)
    },
    {
      name: 'Fish Wrap',
      description: 'Golden crumb-fried fish fillet with tangy tartar and crisp lettuce.',
      basePrice: 13000, // 130 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (190 total)
    },
    {
      name: 'Chicken Nugget Wrap',
      description: 'Crunchy chicken nuggets wrapped with fresh greens and creamy garlic mayo.',
      basePrice: 13000, // 130 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (190 total)
    },
    {
      name: 'Veg Wrap',
      description: 'Crisp vegetable patty with creamy herb dressing, crunchy onions and lettuce.',
      basePrice: 12000, // 120 INR
      isVeg: true,
      comboDelta: 4000, // +40 INR (160 total)
    },
  ];

  for (const item of wraps) {
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: createdCategories['wraps'] },
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          categoryId: createdCategories['wraps'],
        },
      });
    }

    // Add Combo variant: adds fries + cold drink
    await prisma.itemVariant.deleteMany({ where: { menuItemId: menuItem.id } });
    await prisma.itemVariant.create({
      data: {
        menuItemId: menuItem.id,
        name: 'Combo (Adds Fries + Cold Drink)',
        priceDelta: item.comboDelta,
      },
    });

    // Link all add-ons
    for (const addOnId of Object.values(createdAddOns)) {
      await prisma.menuItemAddOn.upsert({
        where: { menuItemId_addOnId: { menuItemId: menuItem.id, addOnId } },
        update: {},
        create: { menuItemId: menuItem.id, addOnId },
      });
    }
  }

  // Burgers
  const burgers = [
    {
      name: 'Zinger Burger',
      description: 'Extra crispy chicken breast tossed in hot spices with shredded lettuce and sesame bun.',
      basePrice: 11000, // 110 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (170 total)
    },
    {
      name: 'Chicken Nugget Burger',
      description: 'Golden chicken nuggets layered with melted cheese slice and spicy mayo.',
      basePrice: 11000, // 110 INR
      isVeg: false,
      comboDelta: 6000, // +60 INR (170 total)
    },
    {
      name: 'Veg Burger',
      description: 'Classic crunchy potato & peas patty with secret spice rub and herb mayo.',
      basePrice: 7000, // 70 INR
      isVeg: true,
      comboDelta: 6000, // +60 INR (130 total)
    },
  ];

  for (const item of burgers) {
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: createdCategories['burgers'] },
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          categoryId: createdCategories['burgers'],
        },
      });
    }

    await prisma.itemVariant.deleteMany({ where: { menuItemId: menuItem.id } });
    await prisma.itemVariant.create({
      data: {
        menuItemId: menuItem.id,
        name: 'Combo (Adds Fries + Cold Drink)',
        priceDelta: item.comboDelta,
      },
    });

    for (const addOnId of Object.values(createdAddOns)) {
      await prisma.menuItemAddOn.upsert({
        where: { menuItemId_addOnId: { menuItemId: menuItem.id, addOnId } },
        update: {},
        create: { menuItemId: menuItem.id, addOnId },
      });
    }
  }

  // Fried Chicken
  const friedChicken = [
    {
      name: 'Fried Chicken 4 pcs',
      description: 'Hand-breaded juicy chicken pieces, fried golden with our signature 11-spice crust.',
      basePrice: 22000, // 220 INR
      isVeg: false,
    },
    {
      name: 'Fried Chicken 8 pcs',
      description: 'Sharing bucket of 8 pieces crispy fried chicken, tender inside and crunchy outside.',
      basePrice: 42000, // 420 INR
      isVeg: false,
    },
    {
      name: 'Combo Fried Chicken 4 pcs + Fries + Cool Drink',
      description: '4 pcs crispy fried chicken with hot salted French fries and chilled beverage.',
      basePrice: 29000, // 290 INR
      isVeg: false,
    },
    {
      name: 'Combo Fried Chicken 8 pcs + Fries + Cool Drink',
      description: '8 pcs fried chicken feast accompanied by large fries and chilled beverage.',
      basePrice: 49000, // 490 INR
      isVeg: false,
    },
  ];

  for (const item of friedChicken) {
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: createdCategories['fried-chicken'] },
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          categoryId: createdCategories['fried-chicken'],
        },
      });
    }

    for (const addOnId of Object.values(createdAddOns)) {
      await prisma.menuItemAddOn.upsert({
        where: { menuItemId_addOnId: { menuItemId: menuItem.id, addOnId } },
        update: {},
        create: { menuItemId: menuItem.id, addOnId },
      });
    }
  }

  // Snacks
  const snacks = [
    {
      name: 'French Fries',
      description: 'Classic golden salted potato fries, crispy outside and fluffy inside.',
      basePrice: 8000, // 80 INR
      isVeg: true,
    },
    {
      name: 'Peri Peri Fries',
      description: 'Golden potato fries generously dusted with spicy tangy African peri peri seasoning.',
      basePrice: 9000, // 90 INR
      isVeg: true,
    },
    {
      name: 'Chicken Nugget 6 pcs',
      description: '6 pieces tender minced chicken nuggets coated in crispy breading.',
      basePrice: 9000, // 90 INR
      isVeg: false,
    },
    {
      name: 'Chicken Nugget 12 pcs',
      description: '12 pieces crunchy chicken nuggets served with dipping garlic dip.',
      basePrice: 17000, // 170 INR
      isVeg: false,
    },
    {
      name: 'Chicken Strips 4 pcs',
      description: '4 pieces tender 100% chicken breast fillets crumb-fried to perfection.',
      basePrice: 11000, // 110 INR
      isVeg: false,
    },
    {
      name: 'Fish Strips 4 pcs',
      description: '4 pieces seasoned fish fillet fingers coated with crunchy golden crust.',
      basePrice: 11000, // 110 INR
      isVeg: false,
    },
  ];

  for (const item of snacks) {
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: createdCategories['snacks'] },
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          isVeg: item.isVeg,
          categoryId: createdCategories['snacks'],
        },
      });
    }

    for (const addOnId of Object.values(createdAddOns)) {
      await prisma.menuItemAddOn.upsert({
        where: { menuItemId_addOnId: { menuItemId: menuItem.id, addOnId } },
        update: {},
        create: { menuItemId: menuItem.id, addOnId },
      });
    }
  }
  console.log('Menu items & snacks seeded.');

  // 6. Seed Table QRs (Tables 1 to 12)
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
