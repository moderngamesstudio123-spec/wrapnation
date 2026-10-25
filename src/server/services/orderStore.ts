// Resilient in-memory fallback store for orders on serverless environments
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

const TMP_ORDERS_FILE = path.join(
  process.platform === 'win32' ? process.cwd() : '/tmp',
  'wrapnation_fallback_orders.json'
);

function syncOrdersFromFile() {
  try {
    if (fs.existsSync(TMP_ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_ORDERS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        for (const o of data) {
          if (!global.__wrapNationFallbackOrders!.has(o.id)) {
            global.__wrapNationFallbackOrders!.set(o.id, o);
          }
        }
      }
    }
  } catch {}
}

function persistOrdersToFile() {
  try {
    const list = Array.from(global.__wrapNationFallbackOrders!.values());
    fs.writeFileSync(TMP_ORDERS_FILE, JSON.stringify(list), 'utf-8');
  } catch {}
}

if (!global.__wrapNationFallbackOrders) {
  global.__wrapNationFallbackOrders = new Map<string, FallbackOrder>();
}
if (!global.__wrapNationOrderCounter) {
  global.__wrapNationOrderCounter = 101;
}
if (!global.__wrapNationOccupiedTables) {
  global.__wrapNationOccupiedTables = new Map();
}

export function saveFallbackOrder(order: FallbackOrder) {
  global.__wrapNationFallbackOrders!.set(order.id, order);
  persistOrdersToFile();
  if (order.tableNumber && ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(order.status)) {
    setTableOccupied(order.tableNumber, order.id, order.orderNumber);
  }
}

export function getFallbackOrder(id: string): FallbackOrder | null {
  syncOrdersFromFile();
  return global.__wrapNationFallbackOrders!.get(id) || null;
}

export function getAllFallbackOrders(): FallbackOrder[] {
  syncOrdersFromFile();
  return Array.from(global.__wrapNationFallbackOrders!.values()).reverse();
}

export function updateFallbackOrder(id: string, updates: Partial<FallbackOrder>): FallbackOrder | null {
  syncOrdersFromFile();
  const order = global.__wrapNationFallbackOrders!.get(id);
  if (!order) return null;
  Object.assign(order, updates);
  persistOrdersToFile();
  return order;
}

export function getNextOrderNumber(): number {
  const current = global.__wrapNationOrderCounter || 101;
  global.__wrapNationOrderCounter = current + 1;
  return current;
}

export function setTableOccupied(tableNumber: number, orderId: string, orderNumber: number) {
  global.__wrapNationOccupiedTables!.set(tableNumber, {
    orderId,
    orderNumber,
    occupiedAt: new Date().toISOString(),
  });
}

export function vacateTableStore(tableNumber: number) {
  global.__wrapNationOccupiedTables!.delete(tableNumber);
  for (const order of global.__wrapNationFallbackOrders!.values()) {
    if (order.tableNumber === tableNumber && ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(order.status)) {
      order.status = 'COMPLETED';
    }
  }
}

export function getTableOccupancy(tableNumber: number) {
  return global.__wrapNationOccupiedTables!.get(tableNumber) || null;
}

export function getAllOccupiedTables(): Record<number, { orderId: string; orderNumber: number; occupiedAt: string }> {
  const result: Record<number, { orderId: string; orderNumber: number; occupiedAt: string }> = {};
  for (const [t, data] of global.__wrapNationOccupiedTables!.entries()) {
    result[t] = data;
  }
  return result;
}
