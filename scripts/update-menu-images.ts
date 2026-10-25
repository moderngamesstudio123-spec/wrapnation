import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating menu item images in database...');

  const imageMap: Record<string, string> = {
    // Wraps
    'Chicken Wrap': '/images/food/wrap.jpg',
    'Cheesy Chicken Wrap': '/images/food/wrap.jpg',
    'Fish Wrap': '/images/food/wrap.jpg',
    'Chicken Nugget Wrap': '/images/food/wrap.jpg',
    'Veg Wrap': '/images/food/wrap.jpg',

    // Burgers
    'Zinger Burger': '/images/food/burger.jpg',
    'Chicken Nugget Burger': '/images/food/burger.jpg',
    'Veg Burger': '/images/food/burger.jpg',

    // Fried Chicken
    'Fried Chicken 4 pcs': '/images/food/fried-chicken.jpg',
    'Fried Chicken 8 pcs': '/images/food/fried-chicken.jpg',
    'Combo Fried Chicken 4 pcs + Fries + Cool Drink': '/images/food/fried-chicken.jpg',
    'Combo Fried Chicken 8 pcs + Fries + Cool Drink': '/images/food/fried-chicken.jpg',

    // Snacks
    'French Fries': '/images/food/french-fries.jpg',
    'Peri Peri Fries': '/images/food/peri-peri-fries.jpg',
    'Chicken Nugget 6 pcs': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    'Chicken Nugget 12 pcs': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    'Chicken Strips 4 pcs': '/images/food/fried-chicken.jpg',
    'Fish Strips 4 pcs': '/images/food/fried-chicken.jpg',
  };

  for (const [name, imageUrl] of Object.entries(imageMap)) {
    const updated = await prisma.menuItem.updateMany({
      where: { name },
      data: { imageUrl },
    });
    console.log(`Updated ${name}: ${updated.count} items with ${imageUrl}`);
  }

  console.log('Menu images update complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
