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
}

if (!global.__wrapNationFallbackOrders) {
  global.__wrapNationFallbackOrders = new Map<string, FallbackOrder>();
}
if (!global.__wrapNationOrderCounter) {
  global.__wrapNationOrderCounter = 101;
}

export function saveFallbackOrder(order: FallbackOrder) {
  global.__wrapNationFallbackOrders!.set(order.id, order);
}

export function getFallbackOrder(id: string): FallbackOrder | null {
  return global.__wrapNationFallbackOrders!.get(id) || null;
}

export function getAllFallbackOrders(): FallbackOrder[] {
  return Array.from(global.__wrapNationFallbackOrders!.values()).reverse();
}

export function getNextOrderNumber(): number {
  const current = global.__wrapNationOrderCounter || 101;
  global.__wrapNationOrderCounter = current + 1;
  return current;
}
