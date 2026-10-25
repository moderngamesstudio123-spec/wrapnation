// Resilient in-memory & cloud-synchronized fallback store for serverless environments
export interface FallbackOrder {
  id: string;
  orderNumber: number;
  takeawayToken: string | null;
  type: string;
  tableNumber: number | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string | null;
  customerPhone: string | null;
  customerUtrHint: string | null;
  cookingNote: string | null;
  subtotal: number;
  tax: number;
  total: number;
  expiresAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  orderItems: Array<{
    id: string;
    itemName: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    addOnsJson: string;
    notes: string | null;
  }>;
  payments: Array<any>;
}

declare global {
  var __wrapNationFallbackOrders: Map<string, FallbackOrder> | undefined;
  var __wrapNationOrderCounter: number | undefined;
  var __wrapNationOccupiedTables: Map<number, { orderId: string; orderNumber: number; occupiedAt: string }> | undefined;
}

import fs from 'fs';
import path from 'path';

const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a17438527f0a16';

const TMP_ORDERS_FILE = path.join(
  process.platform === 'win32' ? process.cwd() : '/tmp',
  'wrapnation_fallback_orders.json'
);

function getTodayKey(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

function syncOrdersFromFile() {
  try {
    if (fs.existsSync(TMP_ORDERS_FILE)) {
      const raw = fs.readFileSync(TMP_ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      let orderList: FallbackOrder[] = [];
      let savedDate: string | undefined;
      let savedCounter: number | undefined;

      if (Array.isArray(parsed)) {
        orderList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        orderList = Array.isArray(parsed.orders) ? parsed.orders : [];
        savedDate = parsed.dailyDate;
        savedCounter = parsed.lastOrderNumber;
        if (parsed.occupiedTables && typeof parsed.occupiedTables === 'object') {
          for (const [t, data] of Object.entries(parsed.occupiedTables)) {
            global.__wrapNationOccupiedTables!.set(Number(t), data as any);
          }
        }
      }

      for (const o of orderList) {
        if (!global.__wrapNationFallbackOrders!.has(o.id)) {
          global.__wrapNationFallbackOrders!.set(o.id, o);
        }
      }

      const todayKey = getTodayKey();
      let maxTodayOrder = 100;
      for (const o of global.__wrapNationFallbackOrders!.values()) {
        try {
          const oDate = new Date(o.createdAt).toLocaleDateString('en-CA');
          if (oDate === todayKey && typeof o.orderNumber === 'number' && o.orderNumber > maxTodayOrder) {
            maxTodayOrder = o.orderNumber;
          }
        } catch {}
      }

      if (savedDate === todayKey && typeof savedCounter === 'number' && savedCounter > maxTodayOrder) {
        maxTodayOrder = savedCounter;
      }

      global.__wrapNationOrderCounter = Math.max(global.__wrapNationOrderCounter || 100, maxTodayOrder);
    }
  } catch (err) {
    console.warn('Error reading fallback orders file:', err);
  }
}

function persistOrdersToFile() {
  try {
    const list = Array.from(global.__wrapNationFallbackOrders!.values());
    const tables: Record<number, any> = {};
    for (const [t, d] of global.__wrapNationOccupiedTables!.entries()) {
      tables[t] = d;
    }

    const payload = {
      dailyDate: getTodayKey(),
      lastOrderNumber: global.__wrapNationOrderCounter || 100,
      orders: list,
      occupiedTables: tables,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(TMP_ORDERS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting fallback orders file:', err);
  }
}

export async function syncOrdersFromCloud(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(CLOUD_STORE_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const cloudOrders = json.data?.orders;
      if (Array.isArray(cloudOrders)) {
        for (const o of cloudOrders) {
          global.__wrapNationFallbackOrders!.set(o.id, o);
        }
      }
      if (json.data?.occupiedTables && typeof json.data.occupiedTables === 'object') {
        for (const [t, data] of Object.entries(json.data.occupiedTables)) {
          global.__wrapNationOccupiedTables!.set(Number(t), data as any);
        }
      }
    }
  } catch {}
}

export async function persistOrdersToCloud(): Promise<void> {
  try {
    const list = Array.from(global.__wrapNationFallbackOrders!.values());
    const tables: Record<number, any> = {};
    for (const [t, d] of global.__wrapNationOccupiedTables!.entries()) {
      tables[t] = d;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'WrapNation_Master_Store_v1',
        data: {
          orders: list,
          occupiedTables: tables,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {}
}

if (!global.__wrapNationFallbackOrders) {
  global.__wrapNationFallbackOrders = new Map<string, FallbackOrder>();
}
if (!global.__wrapNationOrderCounter) {
  global.__wrapNationOrderCounter = 100;
}
if (!global.__wrapNationOccupiedTables) {
  global.__wrapNationOccupiedTables = new Map();
}

// Initial sync on boot
syncOrdersFromFile();

export async function saveFallbackOrder(order: FallbackOrder): Promise<void> {
  syncOrdersFromFile();
  global.__wrapNationFallbackOrders!.set(order.id, order);
  if (typeof order.orderNumber === 'number' && order.orderNumber > (global.__wrapNationOrderCounter || 100)) {
    global.__wrapNationOrderCounter = order.orderNumber;
  }
  persistOrdersToFile();
  if (order.tableNumber && ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(order.status)) {
    setTableOccupied(order.tableNumber, order.id, order.orderNumber);
  }
  persistOrdersToCloud().catch(() => {});
}

export async function getFallbackOrder(id: string): Promise<FallbackOrder | null> {
  syncOrdersFromFile();
  let found = global.__wrapNationFallbackOrders!.get(id);
  if (!found) {
    // Non-blocking quick check
    await syncOrdersFromCloud().catch(() => {});
    found = global.__wrapNationFallbackOrders!.get(id);
  }
  return found || null;
}

export async function getAllFallbackOrders(): Promise<FallbackOrder[]> {
  syncOrdersFromFile();
  // Sync to/from cloud in the background so local responses are instant (<5ms)
  syncOrdersFromCloud().catch(() => {});
  return Array.from(global.__wrapNationFallbackOrders!.values()).reverse();
}

export async function updateFallbackOrder(id: string, updates: Partial<FallbackOrder>): Promise<FallbackOrder | null> {
  syncOrdersFromFile();
  let order = global.__wrapNationFallbackOrders!.get(id);
  if (!order) {
    await syncOrdersFromCloud().catch(() => {});
    order = global.__wrapNationFallbackOrders!.get(id);
  }
  if (!order) return null;
  Object.assign(order, updates);
  persistOrdersToFile();
  persistOrdersToCloud().catch(() => {});
  return order;
}

export function getMaxFallbackDailyOrderStats(startOfDay: Date): { maxOrderNumber: number; takeawayCount: number } {
  syncOrdersFromFile();
  let maxOrderNumber = 100;
  let takeawayCount = 0;
  const startMs = startOfDay.getTime();

  for (const o of global.__wrapNationFallbackOrders!.values()) {
    try {
      const createdAtMs = new Date(o.createdAt).getTime();
      if (createdAtMs >= startMs) {
        if (typeof o.orderNumber === 'number' && o.orderNumber > maxOrderNumber) {
          maxOrderNumber = o.orderNumber;
        }
        if (o.type === 'TAKEAWAY') {
          takeawayCount++;
        }
      }
    } catch {}
  }

  const currentCounter = global.__wrapNationOrderCounter || 100;
  if (currentCounter > maxOrderNumber) {
    maxOrderNumber = currentCounter;
  }

  return { maxOrderNumber, takeawayCount };
}

export function getNextOrderNumber(seedMin?: number): number {
  syncOrdersFromFile();
  const current = global.__wrapNationOrderCounter || 100;
  const next = Math.max(current, seedMin || 100, 100) + 1;
  global.__wrapNationOrderCounter = next;
  persistOrdersToFile();
  return next;
}

export function setTableOccupied(tableNumber: number, orderId: string, orderNumber: number) {
  global.__wrapNationOccupiedTables!.set(tableNumber, {
    orderId,
    orderNumber,
    occupiedAt: new Date().toISOString(),
  });
}

export async function vacateTableStore(tableNumber: number): Promise<void> {
  global.__wrapNationOccupiedTables!.delete(tableNumber);
  for (const order of global.__wrapNationFallbackOrders!.values()) {
    if (order.tableNumber === tableNumber && ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(order.status)) {
      order.status = 'COMPLETED';
    }
  }
  persistOrdersToFile();
  await persistOrdersToCloud().catch(() => {});
}

export async function getTableOccupancy(tableNumber: number) {
  syncOrdersFromFile();
  let found = global.__wrapNationOccupiedTables!.get(tableNumber);
  if (!found) {
    await syncOrdersFromCloud().catch(() => {});
    found = global.__wrapNationOccupiedTables!.get(tableNumber);
  }
  return found || null;
}

export function getAllOccupiedTables(): Record<number, { orderId: string; orderNumber: number; occupiedAt: string }> {
  const result: Record<number, { orderId: string; orderNumber: number; occupiedAt: string }> = {};
  for (const [t, data] of global.__wrapNationOccupiedTables!.entries()) {
    result[t] = data;
  }
  return result;
}
