import prisma from '@/lib/db';
import { logAudit } from './auditService';
import { verifyPassword } from '@/lib/auth/argon';

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  gstEnabled: boolean;
  gstin: string | null;
  gstPercentage: number;
  currency: string;
  openingTime: string;
  closingTime: string;
  tablesCount: number;
  unpaidOrderTimeoutMins: number;
  upiId: string;
  payeeName: string;
  upiQrUrl: string;
  printerPaperWidth: '80' | '58';
  printerEnabled: boolean;
  googleMapsUrl: string | null;
}

export async function getSettings(): Promise<ShopSettings> {
  const map: Record<string, string> = {};
  try {
    const records = await prisma.setting.findMany();
    for (const r of records) {
      map[r.key] = r.value;
    }
  } catch (err) {
    console.warn('Could not read settings from DB, using defaults:', err);
  }

  return {
    shopName: map['shop_name'] || 'Wrap Nation',
    shopAddress: map['shop_address'] || '8-4, 549/48, AG Colony Rd, Erragadda, Hyderabad, Telangana 500038',
    shopPhone: map['shop_phone'] || '+91 81250 57086',
    gstEnabled: map['gst_enabled'] === 'true',
    gstin: map['gstin'] || '',
    gstPercentage: parseFloat(map['gst_percentage'] || '5'),
    currency: map['currency'] || 'INR',
    openingTime: map['opening_time'] || '11:00',
    closingTime: map['closing_time'] || '01:00',
    tablesCount: parseInt(map['tables_count'] || '12', 10),
    unpaidOrderTimeoutMins: parseInt(map['unpaid_order_timeout_mins'] || '15', 10),
    upiId: map['upi_id'] || 'wrapnation@okaxis',
    payeeName: map['payee_name'] || 'Wrap Nation Fast Food',
    upiQrUrl: map['upi_qr_url'] || '',
    printerPaperWidth: (map['printer_paper_width'] === '58' ? '58' : '80') as '80' | '58',
    printerEnabled: map['printer_enabled'] !== 'false',
    googleMapsUrl: map['google_maps_url'] || 'https://share.google/K02BROH8ES5iuiEmh',
  };
}

export async function isShopOpen(): Promise<{ open: boolean; message?: string }> {
  // Always open during testing and active service so orders are never blocked
  return { open: true };
}

export async function updateShopSettings(
  settings: Partial<ShopSettings>,
  userId: string,
  ip?: string
): Promise<void> {
  const keyMap: Record<string, string | undefined> = {
    shop_name: settings.shopName,
    shop_address: settings.shopAddress,
    shop_phone: settings.shopPhone,
    gst_enabled: settings.gstEnabled !== undefined ? String(settings.gstEnabled) : undefined,
    gstin: settings.gstin !== undefined ? (settings.gstin ?? '') : undefined,
    gst_percentage: settings.gstPercentage !== undefined ? String(settings.gstPercentage) : undefined,
    opening_time: settings.openingTime,
    closing_time: settings.closingTime,
    tables_count: settings.tablesCount !== undefined ? String(settings.tablesCount) : undefined,
    unpaid_order_timeout_mins: settings.unpaidOrderTimeoutMins !== undefined ? String(settings.unpaidOrderTimeoutMins) : undefined,
    printer_paper_width: settings.printerPaperWidth,
    printer_enabled: settings.printerEnabled !== undefined ? String(settings.printerEnabled) : undefined,
    google_maps_url: settings.googleMapsUrl !== undefined ? (settings.googleMapsUrl ?? '') : undefined,
  };

  for (const [key, value] of Object.entries(keyMap)) {
    if (value !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
  }

  await logAudit({
    userId,
    action: 'SHOP_SETTINGS_UPDATE',
    resource: 'Setting',
    details: { updatedKeys: Object.keys(keyMap).filter(k => keyMap[k] !== undefined) },
    ipAddress: ip,
  });
}

export async function updateUpiSettings(
  params: { upiId: string; payeeName: string; qrImageUrl?: string | null; currentPassword: string },
  ownerUserId: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify that the owner's password is valid
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner || owner.role !== 'OWNER') {
    return { success: false, error: 'Only the store OWNER can modify payment UPI settings' };
  }

  const isValidPassword = await verifyPassword(params.currentPassword, owner.passwordHash);
  if (!isValidPassword) {
    await logAudit({
      userId: ownerUserId,
      action: 'FAILED_UPI_SETTINGS_CHANGE',
      resource: 'Setting',
      details: { reason: 'Invalid owner password' },
      ipAddress: ip,
    });
    return { success: false, error: 'Owner password verification failed' };
  }

  // 2. Update UPI ID, Payee Name, QR Image URL
  await prisma.setting.upsert({
    where: { key: 'upi_id' },
    update: { value: params.upiId.trim() },
    create: { key: 'upi_id', value: params.upiId.trim() },
  });

  await prisma.setting.upsert({
    where: { key: 'payee_name' },
    update: { value: params.payeeName.trim() },
    create: { key: 'payee_name', value: params.payeeName.trim() },
  });

  if (params.qrImageUrl !== undefined) {
    await prisma.setting.upsert({
      where: { key: 'upi_qr_url' },
      update: { value: params.qrImageUrl || '' },
      create: { key: 'upi_qr_url', value: params.qrImageUrl || '' },
    });
  }

  await logAudit({
    userId: ownerUserId,
    action: 'UPI_SETTINGS_UPDATED',
    resource: 'Setting',
    details: { upiId: params.upiId, payeeName: params.payeeName, hasQr: !!params.qrImageUrl },
    ipAddress: ip,
  });

  return { success: true };
}
