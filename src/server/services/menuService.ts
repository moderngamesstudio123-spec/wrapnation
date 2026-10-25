import prisma from '@/lib/db';
import { logAudit } from './auditService';
import { rupeesToPaise } from '@/lib/format';
import { DEFAULT_CATEGORIES, DEFAULT_ADDONS } from './defaultMenu';

export async function getPublicMenu(): Promise<any> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: {
              where: { isAvailable: true },
              orderBy: { priceDelta: 'asc' },
            },
            addOnLinks: {
              include: {
                addOn: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (categories && categories.length > 0) {
      return categories;
    }
  } catch (err) {
    console.warn('Database connection warning in getPublicMenu, serving resilient fallback menu:', err);
  }

  return DEFAULT_CATEGORIES as any;
}

export async function getAdminMenu() {
  try {
    const [categories, allAddOns] = await Promise.all([
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              variants: {
                orderBy: { priceDelta: 'asc' },
              },
              addOnLinks: {
                include: {
                  addOn: true,
                },
              },
            },
          },
        },
      }),
      prisma.addOn.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    if (categories && categories.length > 0) {
      return { categories, allAddOns };
    }
  } catch (err) {
    console.warn('Database connection warning in getAdminMenu, serving fallback:', err);
  }

  return { categories: DEFAULT_CATEGORIES as any, allAddOns: DEFAULT_ADDONS as any };
}

export async function toggleItemStock(
  itemId: string,
  isAvailable: boolean,
  userId: string,
  ip?: string
) {
  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable },
  });

  await logAudit({
    userId,
    action: isAvailable ? 'MENU_ITEM_IN_STOCK' : 'MENU_ITEM_OUT_OF_STOCK',
    resource: 'MenuItem',
    details: { itemId, itemName: updated.name, isAvailable },
    ipAddress: ip,
  });

  return updated;
}

export interface UpsertMenuItemParams {
  id?: string;
  categoryId: string;
  name: string;
  description?: string | null;
  basePriceRupees: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  variants?: Array<{ name: string; priceDeltaRupees: number; isDefault?: boolean }>;
  addOnIds?: string[];
}

export async function upsertMenuItem(
  params: UpsertMenuItemParams,
  userId: string,
  ip?: string
) {
  const basePricePaise = rupeesToPaise(params.basePriceRupees);

  if (params.id) {
    // Update existing item
    const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
    const isPriceChanged = existing && existing.basePrice !== basePricePaise;

    const item = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        categoryId: params.categoryId,
        name: params.name,
        description: params.description || null,
        basePrice: basePricePaise,
        isVeg: params.isVeg,
        isAvailable: params.isAvailable,
        imageUrl: params.imageUrl || null,
      },
    });

    // Update variants if provided
    if (params.variants) {
      await prisma.itemVariant.deleteMany({ where: { menuItemId: item.id } });
      for (const v of params.variants) {
        await prisma.itemVariant.create({
          data: {
            menuItemId: item.id,
            name: v.name,
            priceDelta: rupeesToPaise(v.priceDeltaRupees),
            isDefault: v.isDefault || false,
          },
        });
      }
    }

    // Update add-ons if provided
    if (params.addOnIds) {
      await prisma.menuItemAddOn.deleteMany({ where: { menuItemId: item.id } });
      for (const addOnId of params.addOnIds) {
        await prisma.menuItemAddOn.create({
          data: { menuItemId: item.id, addOnId },
        });
      }
    }

    await logAudit({
      userId,
      action: isPriceChanged ? 'MENU_PRICE_CHANGE' : 'MENU_ITEM_UPDATE',
      resource: 'MenuItem',
      details: {
        itemId: item.id,
        name: item.name,
        oldPrice: existing?.basePrice,
        newPrice: basePricePaise,
      },
      ipAddress: ip,
    });

    return item;
  } else {
    // Create new item
    const item = await prisma.menuItem.create({
      data: {
        categoryId: params.categoryId,
        name: params.name,
        description: params.description || null,
        basePrice: basePricePaise,
        isVeg: params.isVeg,
        isAvailable: params.isAvailable,
        imageUrl: params.imageUrl || null,
      },
    });

    if (params.variants && params.variants.length > 0) {
      for (const v of params.variants) {
        await prisma.itemVariant.create({
          data: {
            menuItemId: item.id,
            name: v.name,
            priceDelta: rupeesToPaise(v.priceDeltaRupees),
            isDefault: v.isDefault || false,
          },
        });
      }
    }

    if (params.addOnIds && params.addOnIds.length > 0) {
      for (const addOnId of params.addOnIds) {
        await prisma.menuItemAddOn.create({
          data: { menuItemId: item.id, addOnId },
        });
      }
    }

    await logAudit({
      userId,
      action: 'MENU_ITEM_CREATE',
      resource: 'MenuItem',
      details: { itemId: item.id, name: item.name, price: basePricePaise },
      ipAddress: ip,
    });

    return item;
  }
}
