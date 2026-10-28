'use client';

import React, { useState, useEffect } from 'react';
import VegBadge from '@/components/customer/VegBadge';
import { formatPaise } from '@/lib/format';
import {
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  isVeg: boolean;
  isAvailable: boolean;
  variants: Array<{ id: string; name: string; priceDelta: number }>;
  addOnLinks: Array<{ addOn: { id: string; name: string; price: number } }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

interface BillingCartItem {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
  addOns: Array<{ id: string; name: string; price: number }>;
}

export default function ManualBillingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<BillingCartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('9999999999');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [utr, setUtr] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const addToCart = (item: MenuItem, variant?: { id: string; name: string; priceDelta: number }) => {
    const key = `${item.id}_${variant?.id || 'base'}`;
    const unitPrice = item.basePrice + (variant ? variant.priceDelta : 0);

    setCartItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          addOns: [],
        },
      ];
    });
  };

  const updateQuantity = (key: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    setSuccessMessage(null);

    try {
      // 1. Create order
      // For manual billing dine-in without scanned token, we use a signed token or direct takeaway
      const orderPayload = {
        type: 'TAKEAWAY', // walk-in counter order
        customerName: customerName || 'Walk-in',
        customerPhone: customerPhone || '9999999999',
        paymentMethod,
        whatsappOptIn: false,
        cookingNote: orderType === 'DINE_IN' ? `Table #${tableNumber}` : 'Counter Walk-in',
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId || null,
          addOnIds: [],
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      // 2. Immediately mark as paid by counter staff
      const payRes = await fetch(`/api/orders/${orderData.order.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
          utr: utr.trim() || null,
          notes: 'POS Walk-in Billing',
        }),
      });

      if (!payRes.ok) throw new Error('Payment confirmation error');

      setSuccessMessage(
        `Order ${orderData.order.takeawayToken || `#${orderData.order.orderNumber}`} created & printed!`
      );
      setCartItems([]);
      setUtr('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error in manual billing');
    } finally {
      setLoading(false);
    }
  };

  const allItems = categories.flatMap((c) => c.items);
  const displayedItems =
    selectedCategory === 'all'
      ? allItems
      : categories.find((c) => c.slug === selectedCategory)?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-950 tracking-tight">
          Walk-in POS Manual Billing
        </h1>
        <p className="text-xs text-neutral-600 font-medium">
          Fast touch & keyboard-friendly billing for counter walk-in customers
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Menu Category & Item Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
                selectedCategory === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-black shadow-sm border border-amber-500/40'
                  : 'bg-white text-neutral-700 hover:text-neutral-950 hover:bg-amber-50 border border-neutral-200/90'
              }`}
            >
              All Items ({allItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
                  selectedCategory === c.slug
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm border border-amber-500/40'
                    : 'bg-white text-neutral-700 hover:text-neutral-950 hover:bg-amber-50 border border-neutral-200/90'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between gap-2.5 hover:border-amber-400 transition cursor-pointer select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <VegBadge isVeg={item.isVeg} />
                    <span className="font-bold text-xs text-neutral-900 line-clamp-1">{item.name}</span>
                  </div>
                  <div className="font-black text-amber-600 text-sm">
                    {formatPaise(item.basePrice)}
                  </div>
                </div>

                <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs shadow-xs transition cursor-pointer"
                  >
                    + Add Regular
                  </button>

                  {item.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => addToCart(item, v)}
                      className="w-full py-1 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold transition cursor-pointer"
                    >
                      + Combo ({formatPaise(item.basePrice + v.priceDelta)})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Current Bill & Checkout */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-md flex flex-col justify-between gap-4 h-fit sticky top-20">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="font-black text-base text-neutral-950">Current Order</h2>
              <span className="text-xs text-neutral-500 font-bold">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Tap items on the left to add to bill
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                {cartItems.map((item) => (
                  <div key={item.key} className="pt-2 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-900 leading-tight">{item.name}</div>
                      {item.variantName && (
                        <div className="text-[10px] text-amber-700 font-semibold">{item.variantName}</div>
                      )}
                      <div className="text-neutral-500 font-mono">
                        {formatPaise(item.unitPrice)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg bg-neutral-100 border border-neutral-200">
                        <button
                          onClick={() => updateQuantity(item.key, -1)}
                          className="p-1 hover:text-rose-600 transition"
                        >
                          <Minus className="w-3 h-3 text-neutral-700" />
                        </button>
                        <span className="px-1.5 font-bold text-neutral-900 min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, 1)}
                          className="p-1 hover:text-neutral-950 transition"
                        >
                          <Plus className="w-3 h-3 text-neutral-700" />
                        </button>
                      </div>
                      <span className="font-bold text-neutral-950 min-w-[50px] text-right">
                        {formatPaise(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-600">Total Amount</span>
              <span className="text-2xl font-black text-neutral-950">{formatPaise(subtotal)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer shadow-xs ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-400 bg-amber-400 text-neutral-950 font-black'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer shadow-xs ${
                    paymentMethod === 'UPI'
                      ? 'border-amber-400 bg-amber-400 text-neutral-950 font-black'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI Soundbox</span>
                </button>
              </div>

              {paymentMethod === 'UPI' && (
                <input
                  type="text"
                  placeholder="UTR / Ref digits (optional)"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-amber-400 font-mono shadow-xs"
                />
              )}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <span>Charge {formatPaise(subtotal)} & Print</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
