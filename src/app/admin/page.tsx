'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MarkPaidModal from '@/components/admin/MarkPaidModal';
import { formatPaise } from '@/lib/format';
import {
  Clock,
  ChefHat,
  Bell,
  CheckCheck,
  RefreshCw,
  Printer,
  ShoppingBag,
  Utensils,
  Volume2,
  VolumeX,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface OrderItem {
  id: string;
  itemName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  addOnsJson?: string;
  notes?: string | null;
}

interface Order {
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
  createdAt: string;
  orderItems: OrderItem[];
}

export default function AdminLiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [reprintingOrderId, setReprintingOrderId] = useState<string | null>(null);

  const prevOrderCountRef = useRef<number>(0);

  // Synthesize sound alert using Web Audio API (zero audio file dependencies)
  const playAudioChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // First tone (800Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);

      // Second tone (1050Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1050, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const incomingOrders: Order[] = data.orders || [];

        // Check if a new order arrived
        if (
          prevOrderCountRef.current > 0 &&
          incomingOrders.length > prevOrderCountRef.current
        ) {
          playAudioChime();
        }

        prevOrderCountRef.current = incomingOrders.length;
        setOrders(incomingOrders);
      }
    } catch {}
    setLoading(false);
  }, [playAudioChime]);

  useEffect(() => {
    fetchOrders();

    // Connect to Server-Sent Events for real-time live feed
    const eventSource = new EventSource('/api/orders/stream');

    eventSource.addEventListener('NEW_ORDER', () => {
      playAudioChime();
      fetchOrders();
    });

    eventSource.addEventListener('ORDER_STATUS_CHANGED', () => {
      fetchOrders();
    });

    eventSource.addEventListener('PAYMENT_CONFIRMED', () => {
      fetchOrders();
    });

    eventSource.addEventListener('CUSTOMER_UTR_HINT', () => {
      fetchOrders();
    });

    const pollInterval = setInterval(fetchOrders, 8000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, [fetchOrders, playAudioChime]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {}
  };

  const handleReprint = async (orderId: string) => {
    setReprintingOrderId(orderId);
    try {
      await fetch(`/api/orders/${orderId}/reprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}
    setTimeout(() => setReprintingOrderId(null), 1000);
  };

  // Metrics
  const activeOrders = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'EXPIRED'
  );
  const awaitingPaymentCount = orders.filter((o) => o.status === 'AWAITING_PAYMENT').length;
  const preparingCount = orders.filter(
    (o) => o.status === 'PAID' || o.status === 'PREPARING'
  ).length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ACTIVE') {
      return o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'EXPIRED';
    }
    if (filter === 'AWAITING_PAYMENT') return o.status === 'AWAITING_PAYMENT';
    if (filter === 'PREPARING') return o.status === 'PAID' || o.status === 'PREPARING';
    if (filter === 'READY') return o.status === 'READY';
    if (filter === 'COMPLETED') return o.status === 'COMPLETED';
    return true;
  });

  const getAgeMins = (createdAt: string): number => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
            <span>Live Kitchen & Orders Board</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </h1>
          <p className="text-xs text-neutral-600 font-medium">
            Real-time SSE order stream • Auto-printing on 80mm thermal printer
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              soundEnabled
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
            }`}
            title={soundEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime On' : 'Chime Off'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-amber-50/70 text-neutral-800 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setFilter('ACTIVE')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
            filter === 'ACTIVE'
              ? 'bg-white border-amber-400 ring-2 ring-amber-400/30 shadow-md'
              : 'bg-white/90 border-neutral-200/90 hover:border-amber-300'
          }`}
        >
          <span className="text-xs text-neutral-600 font-bold uppercase tracking-wider block">
            Active Orders
          </span>
          <span className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1 block">
            {activeOrders.length}
          </span>
        </div>

        <div
          onClick={() => setFilter('AWAITING_PAYMENT')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
            filter === 'AWAITING_PAYMENT'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
              : 'bg-white/90 border-neutral-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">
              Awaiting Payment
            </span>
            {awaitingPaymentCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {awaitingPaymentCount}
          </span>
        </div>

        <div
          onClick={() => setFilter('PREPARING')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
            filter === 'PREPARING'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30 shadow-md'
              : 'bg-white/90 border-neutral-200/90 hover:border-blue-300'
          }`}
        >
          <span className="text-xs text-blue-800 font-bold uppercase tracking-wider block">
            Kitchen (Cooking)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
            {preparingCount}
          </span>
        </div>

        <div
          onClick={() => setFilter('READY')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
            filter === 'READY'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
              : 'bg-white/90 border-neutral-200/90 hover:border-emerald-300'
          }`}
        >
          <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">
            Ready for Pickup
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {readyCount}
          </span>
        </div>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-200">
        {[
          { key: 'ACTIVE', label: `Active (${activeOrders.length})` },
          { key: 'AWAITING_PAYMENT', label: `Awaiting Payment (${awaitingPaymentCount})` },
          { key: 'PREPARING', label: `Kitchen (${preparingCount})` },
          { key: 'READY', label: `Ready (${readyCount})` },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'ALL', label: `All Today (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs cursor-pointer ${
              filter === tab.key
                ? 'bg-amber-400 text-neutral-950 font-black shadow-sm border border-amber-500/40'
                : 'bg-white text-neutral-700 hover:text-neutral-950 hover:bg-amber-50 border border-neutral-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Order Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/90 shadow-sm space-y-3">
          <ChefHat className="w-10 h-10 text-neutral-400 mx-auto" />
          <p className="text-sm text-neutral-600 font-semibold">No orders in this status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const ageMins = getAgeMins(order.createdAt);
            const isUnpaid = order.status === 'AWAITING_PAYMENT';
            const orderTokenLabel = order.takeawayToken || `#${order.orderNumber}`;

            return (
              <div
                key={order.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition shadow-sm hover:shadow-md bg-white ${
                  isUnpaid
                    ? ageMins >= 10
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : 'border-amber-400'
                    : order.status === 'READY'
                    ? 'border-emerald-400 ring-1 ring-emerald-300'
                    : 'border-neutral-200/90'
                }`}
              >
                {/* Header: Token, Type & Age */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-black text-neutral-950 tracking-tight">
                        {orderTokenLabel}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                          {order.type === 'DINE_IN' ? (
                            <>
                              <Utensils className="w-3.5 h-3.5 text-amber-600" />
                              <span>Table {order.tableNumber}</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                              <span>Takeaway ({order.customerName || 'Counter'})</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isUnpaid
                            ? ageMins >= 10
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                            : order.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{ageMins}m ago</span>
                      </span>

                      <div className="text-sm font-black text-neutral-950">
                        {formatPaise(order.total)}
                      </div>
                    </div>
                  </div>

                  {/* Customer hint highlight if customer entered last 4 digits */}
                  {order.customerUtrHint && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
                      <span className="font-bold">Customer UTR Hint:</span>
                      <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-amber-300 text-neutral-950">
                        {order.customerUtrHint}
                      </span>
                    </div>
                  )}

                  {/* Cooking Note if any */}
                  {order.cookingNote && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>Note: {order.cookingNote}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="py-2.5 border-t border-b border-neutral-200/90 space-y-2 text-xs flex-1">
                  {order.orderItems.map((item) => {
                    let addOns: Array<{ name: string }> = [];
                    try {
                      addOns = JSON.parse(item.addOnsJson || '[]');
                    } catch {}

                    return (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-neutral-900">
                            {item.quantity}× {item.itemName}
                          </span>
                          {item.variantName && (
                            <div className="text-[11px] text-amber-700 pl-3 font-semibold">
                              • {item.variantName}
                            </div>
                          )}
                          {addOns.length > 0 && (
                            <div className="text-[11px] text-neutral-600 pl-3">
                              + {addOns.map((a) => a.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <span className="text-neutral-700 font-mono font-bold">
                          {formatPaise(item.subtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Status Actions */}
                <div className="space-y-2 pt-1">
                  {isUnpaid ? (
                    <button
                      onClick={() => setSelectedOrderForPayment(order)}
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 stroke-[3]" />
                      <span>Mark Paid (UPI / Cash)</span>
                    </button>
                  ) : order.status === 'PAID' || order.status === 'PREPARING' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 stroke-[3]" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  ) : order.status === 'READY' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="w-full py-3 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Complete & Deliver</span>
                    </button>
                  ) : null}

                  {/* Secondary Actions: Reprint Slip */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-1">
                    <span className="uppercase font-bold text-neutral-700">
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>

                    <button
                      onClick={() => handleReprint(order.id)}
                      disabled={reprintingOrderId === order.id}
                      className="hover:text-amber-700 font-bold flex items-center gap-1 p-1 transition cursor-pointer text-neutral-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{reprintingOrderId === order.id ? 'Queued...' : 'Reprint Bill'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Paid Modal */}
      {selectedOrderForPayment && (
        <MarkPaidModal
          order={selectedOrderForPayment}
          isOpen={!!selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onSuccess={() => fetchOrders()}
        />
      )}
    </div>
  );
}
