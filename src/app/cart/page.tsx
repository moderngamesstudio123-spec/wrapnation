'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/customer/cartContext';
import { formatPaise } from '@/lib/format';
import VegBadge from '@/components/customer/VegBadge';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  QrCode,
  Banknote,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    tableToken,
    tableNumber,
    isDineIn,
    customerName,
    customerPhone,
    cookingNote,
    whatsappOptIn,
    paymentMethod,
    subtotalPaise,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomerDetails,
    setCookingNote,
    setWhatsappOptIn,
    setPaymentMethod,
  } = useCart();

  const [nameInput, setNameInput] = useState(customerName);
  const [phoneInput, setPhoneInput] = useState(customerPhone);
  const [noteInput, setNoteInput] = useState(cookingNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (!isDineIn) {
      if (!nameInput.trim()) {
        setErrorMessage('Please enter your name for takeaway fulfillment.');
        return;
      }
      const cleanPhone = phoneInput.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      setCustomerDetails(nameInput.trim(), cleanPhone);
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        type: isDineIn ? 'DINE_IN' : 'TAKEAWAY',
        tableToken: isDineIn ? tableToken : null,
        customerName: isDineIn ? null : nameInput.trim(),
        customerPhone: isDineIn ? null : phoneInput.replace(/\D/g, ''),
        whatsappOptIn,
        cookingNote: noteInput.trim() ? noteInput.trim().slice(0, 200) : null,
        paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId || null,
          addOnIds: i.addOns.map((a) => a.id),
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Clear cart and redirect to order status tracking page
      clearCart();
      router.replace(`/order/${data.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while placing order';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <p className="text-sm text-neutral-400">
            Explore our delicious menu of wraps, burgers, and snacks.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-full transition"
              aria-label="Back to menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-black text-white">Your Cart</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-rose-400 font-semibold transition"
          >
            Clear Cart
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Fulfillment Type Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDineIn ? (
                <Utensils className="w-5 h-5 text-amber-400" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              )}
              <span className="font-bold text-sm text-white">
                {isDineIn ? `Dine-in: Table #${tableNumber}` : 'Takeaway Order'}
              </span>
            </div>
            {isDineIn ? (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded-full">
                QR Verified
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                Pick up at counter
              </span>
            )}
          </div>

          {!isDineIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-neutral-400 font-medium block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 font-medium block mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Cart Items List */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Review Items ({items.length})
          </h2>

          <div className="divide-y divide-neutral-800/80">
            {items.map((item) => (
              <div key={item.key} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <VegBadge isVeg={item.isVeg} />
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                  </div>

                  {/* Chosen Variant (Combo) */}
                  {item.variantName && (
                    <div className="text-xs text-amber-400/90 font-medium pl-6">
                      • {item.variantName} (+{formatPaise(item.variantDelta)})
                    </div>
                  )}

                  {/* Chosen Add-ons */}
                  {item.addOns.length > 0 && (
                    <div className="text-xs text-neutral-400 pl-6 space-y-0.5">
                      {item.addOns.map((addon) => (
                        <div key={addon.id}>
                          + {addon.name} ({formatPaise(addon.price)})
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-neutral-400 pl-6 pt-0.5">
                    Rate: {formatPaise(item.unitPrice)}
                  </div>
                </div>

                {/* Quantity Controls & Item Subtotal */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.key, -1)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                      aria-label="Decrease"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="px-2.5 text-xs font-bold text-white min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.key, 1)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-white">
                    {formatPaise(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Cooking Notes */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Cooking Instructions (Optional)</span>
          </div>
          <textarea
            rows={2}
            maxLength={200}
            placeholder="e.g. Less spicy, extra crunchy, no mayo..."
            value={noteInput}
            onChange={(e) => {
              setNoteInput(e.target.value);
              setCookingNote(e.target.value);
            }}
            className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
          ></textarea>
          <div className="text-[11px] text-neutral-500 text-right">
            {noteInput.length}/200 characters
          </div>
        </div>

        {/* 4. Payment Selection */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Select Payment Mode
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              onClick={() => setPaymentMethod('UPI')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'UPI'
                  ? 'border-amber-400 bg-amber-400/10 text-white'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <QrCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-white">Pay via UPI</div>
                <div className="text-xs text-neutral-400 leading-snug">
                  PhonePe, GPay, Paytm or any UPI app
                </div>
              </div>
            </label>

            <label
              onClick={() => setPaymentMethod('CASH')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'CASH'
                  ? 'border-amber-400 bg-amber-400/10 text-white'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <Banknote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-white">Pay with Cash</div>
                <div className="text-xs text-neutral-400 leading-snug">
                  Pay cash directly at the counter
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 5. WhatsApp Opt-in */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
          <input
            id="whatsapp-optin"
            type="checkbox"
            checked={whatsappOptIn}
            onChange={(e) => setWhatsappOptIn(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-neutral-700 text-amber-400 focus:ring-0 bg-neutral-950 cursor-pointer"
          />
          <label htmlFor="whatsapp-optin" className="text-xs text-neutral-300 leading-relaxed cursor-pointer">
            Send order updates and digital invoice to my WhatsApp number.
          </label>
        </div>

        {/* 6. Order Summary */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Item Subtotal</span>
            <span>{formatPaise(subtotalPaise)}</span>
          </div>
          <div className="flex justify-between text-neutral-400 text-xs">
            <span>Taxes & GST</span>
            <span>Calculated on server</span>
          </div>
          <div className="border-t border-neutral-800 pt-2 flex justify-between font-bold text-base text-white">
            <span>Grand Total</span>
            <span className="text-amber-400">{formatPaise(subtotalPaise)}</span>
          </div>
        </div>
      </main>

      {/* Floating Place Order Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-neutral-950 font-black text-base uppercase tracking-wider shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : (
              <span>Place Order • {formatPaise(subtotalPaise)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
