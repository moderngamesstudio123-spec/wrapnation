'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  CheckCheck,
  QrCode,
  ExternalLink,
  Printer,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import Image from 'next/image';

interface OrderTrackingViewProps {
  orderId: string;
}

interface OrderData {
  id: string;
  orderNumber: number;
  takeawayToken?: string | null;
  type: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: number | null;
  status: 'AWAITING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'UPI' | 'CASH';
  customerName?: string | null;
  customerPhone?: string | null;
  customerUtrHint?: string | null;
  cookingNote?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    itemName: string;
    variantName?: string | null;
    unitPriceFormatted: string;
    quantity: number;
    subtotalFormatted: string;
    addOns: Array<{ name: string; price: number }>;
  }>;
}

interface UpiPaymentData {
  upiId: string;
  payeeName: string;
  deepLink: string;
  qrDataUrl: string;
  amountFormatted: string;
}

interface ShopData {
  name: string;
  address: string;
  phone: string;
  gstin?: string | null;
}

export default function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [upiData, setUpiData] = useState<UpiPaymentData | null>(null);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [utrHintInput, setUtrHintInput] = useState('');
  const [submittingHint, setSubmittingHint] = useState(false);
  const [hintSubmitted, setHintSubmitted] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data.order);
      setUpiData(data.upiPaymentData);
      setShop(data.shop);
      if (data.order.customerUtrHint) {
        setUtrHintInput(data.order.customerUtrHint);
        setHintSubmitted(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    // Connect to Server-Sent Events for real-time live updates
    const eventSource = new EventSource(`/api/orders/stream?orderId=${orderId}`);

    eventSource.addEventListener('ORDER_STATUS_CHANGED', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : null));
      } catch {}
    });

    eventSource.addEventListener('PAYMENT_CONFIRMED', () => {
      fetchOrder();
    });

    eventSource.onerror = () => {
      // Re-fetch fallback on error
      fetchOrder();
    };

    // Periodic poll fallback every 12 seconds
    const interval = setInterval(fetchOrder, 12000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [orderId, fetchOrder]);

  const handleSubmitHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(utrHintInput.trim())) return;

    setSubmittingHint(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/customer-utr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last4Digits: utrHintInput.trim() }),
      });
      if (res.ok) {
        setHintSubmitted(true);
      }
    } catch {}
    setSubmittingHint(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-sm text-neutral-400">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-xl font-bold text-rose-400">Unable to find order</h2>
          <p className="text-sm text-neutral-400">{error || 'Please check your order link.'}</p>
          <Link
            href="/menu"
            className="inline-flex py-2.5 px-6 rounded-xl bg-amber-400 text-neutral-950 font-bold text-sm"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const isAwaitingPayment = order.status === 'AWAITING_PAYMENT';
  const isPreparing = order.status === 'PAID' || order.status === 'PREPARING';
  const isReady = order.status === 'READY';
  const isCompleted = order.status === 'COMPLETED';
  const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';

  const orderTokenLabel =
    order.type === 'TAKEAWAY' && order.takeawayToken
      ? order.takeawayToken
      : `#${order.orderNumber}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Top Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="text-xs font-bold text-neutral-400 hover:text-white"
            >
              ← Menu
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-xs font-bold text-amber-400">Order Tracking</span>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Bill</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* 1. Big Order Number Token Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 text-center space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-neutral-800 text-neutral-300 text-xs font-bold">
            {order.type === 'DINE_IN' ? (
              <>
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>Dine-in: Table #{order.tableNumber}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Takeaway Counter Order</span>
              </>
            )}
          </div>

          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-widest block font-medium">
              Your Order Token
            </span>
            <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight mt-1">
              {orderTokenLabel}
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isAwaitingPayment && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
                <Clock className="w-4 h-4" />
                <span>Awaiting Payment Confirmation</span>
              </span>
            )}
            {isPreparing && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <ChefHat className="w-4 h-4" />
                <span>Preparing in Kitchen</span>
              </span>
            )}
            {isReady && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider animate-bounce">
                <Bell className="w-4 h-4" />
                <span>Order Ready! Please Collect</span>
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-neutral-800 text-neutral-300 text-xs font-black uppercase tracking-wider">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Order Completed</span>
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-rose-950 border border-rose-700 text-rose-400 text-xs font-black uppercase tracking-wider">
                <span>Order {order.status}</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Step Progress Bar */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Step 1: Received */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  order ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                1
              </div>
              <span className="text-[11px] font-bold block text-neutral-300">
                Received
              </span>
            </div>

            {/* Step 2: Payment */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  !isAwaitingPayment && !isCancelled
                    ? 'bg-amber-400 text-neutral-950'
                    : isAwaitingPayment
                    ? 'border-2 border-amber-400 text-amber-400 animate-pulse'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                2
              </div>
              <span className="text-[11px] font-bold block text-neutral-300">
                Payment
              </span>
            </div>

            {/* Step 3: Preparing */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  isPreparing || isReady || isCompleted
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-bold block text-neutral-300">
                Kitchen
              </span>
            </div>

            {/* Step 4: Ready */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  isReady || isCompleted
                    ? 'bg-emerald-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                4
              </div>
              <span className="text-[11px] font-bold block text-neutral-300">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* 3. Awaiting Payment Section (Direct UPI QR / Cash instructions) */}
        {isAwaitingPayment && (
          <div className="p-6 rounded-3xl bg-neutral-900 border-2 border-amber-400/40 space-y-6 shadow-2xl">
            {order.paymentMethod === 'UPI' && upiData ? (
              <div className="text-center space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Scan to Pay via UPI</h3>
                  <p className="text-xs text-neutral-400">
                    Use PhonePe, Google Pay, Paytm, or any UPI app
                  </p>
                </div>

                {/* Amount to Pay */}
                <div className="py-2.5 px-6 rounded-2xl bg-amber-400/10 border border-amber-400/30 inline-block">
                  <span className="text-xs text-neutral-400 block font-medium">Exact Amount to Pay</span>
                  <span className="text-3xl font-black text-amber-400">
                    {order.totalFormatted}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
                  {upiData.qrDataUrl && (
                    <Image
                      src={upiData.qrDataUrl}
                      alt="Wrap Nation Shop UPI QR"
                      width={220}
                      height={220}
                      className="w-52 h-52 object-contain"
                    />
                  )}
                </div>

                {/* Payee Info */}
                <div className="text-xs text-neutral-400 space-y-0.5">
                  <p className="text-white font-bold">{upiData.payeeName}</p>
                  <p className="font-mono text-amber-400">{upiData.upiId}</p>
                </div>

                {/* Open UPI App Deep Link Button */}
                <div>
                  <a
                    href={upiData.deepLink}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg transition w-full"
                  >
                    <span>Open in UPI App</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Optional Customer UTR Hint Form */}
                <div className="pt-4 border-t border-neutral-800 text-left space-y-2">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Paid? Enter last 4 digits of UPI Ref / UTR (Optional hint for staff)
                  </label>
                  <form onSubmit={handleSubmitHint} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4821"
                      value={utrHintInput}
                      onChange={(e) => setUtrHintInput(e.target.value.replace(/\D/g, ''))}
                      className="w-32 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-sm text-center focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={submittingHint || utrHintInput.length !== 4}
                      className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {submittingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Save Hint</span>
                    </button>
                  </form>
                  {hintSubmitted && (
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hint recorded for counter staff verification.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Pay at Counter (Cash)</h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Please show your order token <strong className="text-amber-400">{orderTokenLabel}</strong> and pay <strong className="text-white">{order.totalFormatted}</strong> in cash at the counter.
                </p>
              </div>
            )}

            {/* Crucial Security Notice */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Security Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Orders move to the kitchen only after staff confirms payment on the shop soundbox or business app. No button can mark an order paid.
              </p>
            </div>
          </div>
        )}

        {/* 4. Itemized Digital Receipt Card */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-white">{shop?.name || 'Wrap Nation'}</h4>
              <p className="text-neutral-500 text-[11px]">{shop?.address}</p>
              {shop?.gstin && <p className="text-neutral-500 text-[11px]">GSTIN: {shop.gstin}</p>}
            </div>
            <div className="text-right">
              <span className="font-bold text-white block">Token: {orderTokenLabel}</span>
              <span className="text-neutral-500 text-[11px]">
                {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="divide-y divide-neutral-800/60">
            {order.orderItems.map((item) => (
              <div key={item.id} className="py-2 flex items-start justify-between">
                <div>
                  <span className="font-bold text-white">
                    {item.itemName} × {item.quantity}
                  </span>
                  {item.variantName && (
                    <div className="text-[11px] text-amber-400/90">• {item.variantName}</div>
                  )}
                  {item.addOns.length > 0 && (
                    <div className="text-[11px] text-neutral-400">
                      {item.addOns.map((a) => `+ ${a.name}`).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-bold text-neutral-200">{item.subtotalFormatted}</span>
              </div>
            ))}
          </div>

          {/* Subtotal, Tax, Total */}
          <div className="border-t border-neutral-800 pt-3 space-y-1">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span>{order.subtotalFormatted}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>GST Tax</span>
                <span>{order.taxFormatted}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-white pt-1 border-t border-neutral-800">
              <span>Total Amount</span>
              <span className="text-amber-400">{order.totalFormatted}</span>
            </div>
            <div className="flex justify-between text-neutral-500 text-[11px] pt-1">
              <span>Payment Mode</span>
              <span className="uppercase font-semibold text-neutral-300">
                {order.paymentMethod} • {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Printable Receipt for 80mm Browser Fallback */}
        <div className="hidden print:block thermal-receipt-80mm">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>{shop?.name || 'WRAP NATION'}</h2>
            <p>{shop?.address}</p>
            <p>Tel: {shop?.phone}</p>
            {shop?.gstin && <p>GSTIN: {shop.gstin}</p>}
            <p>================================</p>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>TOKEN: {orderTokenLabel}</h3>
            <p>
              Type: {order.type} {order.tableNumber ? `(Table ${order.tableNumber})` : ''}
            </p>
            <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <p>================================</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ verticalAlign: 'top' }}>
                    {item.itemName} x{item.quantity}
                    {item.variantName && <div>• {item.variantName}</div>}
                    {item.addOns.length > 0 && (
                      <div>+ {item.addOns.map((a) => a.name).join(', ')}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                    {item.subtotalFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', textAlign: 'right' }}>
            <p>Subtotal: {order.subtotalFormatted}</p>
            {order.tax > 0 && <p>Tax: {order.taxFormatted}</p>}
            <p style={{ fontSize: '14px', fontWeight: 'bold' }}>TOTAL: {order.totalFormatted}</p>
            <p>
              Status: {order.paymentStatus} ({order.paymentMethod})
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p>*** THANK YOU, VISIT AGAIN ***</p>
          </div>
        </div>
      </main>
    </div>
  );
}
