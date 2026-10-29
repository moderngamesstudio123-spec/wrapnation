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
  Volume2,
  VolumeX,
  FileText,
  DollarSign,
  Search,
  AlertCircle,
  Megaphone,
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

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [reprintingOrderId, setReprintingOrderId] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());

  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Web Speech voice calling
  const speakOrderCalling = (orderNum: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Order number ${orderNum} ready hai! Please collect your food!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Play audio chime for new orders
  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {}
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const incomingOrders: Order[] = data.orders || [];

        // Check for new incoming orders
        const currentKnown = knownOrderIdsRef.current;
        if (currentKnown.size > 0) {
          const hasNew = incomingOrders.some((o) => !currentKnown.has(o.id));
          if (hasNew) playNewOrderSound();
        }

        const newSet = new Set<string>();
        incomingOrders.forEach((o) => newSet.add(o.id));
        knownOrderIdsRef.current = newSet;

        setOrders(incomingOrders);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    }
  }, [playNewOrderSound]);

  useEffect(() => {
    fetchOrders();
    const pollInterval = setInterval(fetchOrders, 5000);
    const clockInterval = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated.order : o)));

        // Voice call automatically if marked READY
        if (nextStatus === 'READY') {
          const target = orders.find((o) => o.id === orderId);
          if (target) speakOrderCalling(target.orderNumber);
        }
      }
    } catch {}
  };

  const handlePrintSlip = async (orderId: string, slipType: 'KITCHEN' | 'CUSTOMER_BILL') => {
    setReprintingOrderId(`${orderId}-${slipType}`);
    try {
      await fetch('/api/printer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, slipType }),
      });
    } catch {}
    setReprintingOrderId(null);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchToken = order.orderNumber.toString().includes(q);
      const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
      const matchName = (order.customerName || '').toLowerCase().includes(q);
      if (!matchToken && !matchPhone && !matchName) return false;
    }

    if (filter === 'ACTIVE') {
      return ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(order.status);
    }
    if (filter === 'AWAITING_PAYMENT') return order.status === 'AWAITING_PAYMENT';
    if (filter === 'PREPARING') return order.status === 'PREPARING' || order.status === 'PAID';
    if (filter === 'READY') return order.status === 'READY';
    if (filter === 'COMPLETED') return order.status === 'COMPLETED';
    return true;
  });

  const activeCount = orders.filter((o) =>
    ['AWAITING_PAYMENT', 'PAID', 'PREPARING', 'READY'].includes(o.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            <span>Live Kitchen & Counter Board</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-neutral-950">
              {activeCount} Active
            </span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Accept payments, manage food preparation, and call order numbers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              soundEnabled
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-neutral-100 border-neutral-200 text-neutral-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Alert Sound ON' : 'Muted'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchOrders()}
            className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 thin-scrolling">
          {[
            { id: 'ACTIVE', label: 'All Active' },
            { id: 'AWAITING_PAYMENT', label: '⏳ Unpaid' },
            { id: 'PREPARING', label: '👨‍🍳 In Kitchen' },
            { id: 'READY', label: '📢 Ready to Call' },
            { id: 'COMPLETED', label: '✅ Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filter === tab.id
                  ? 'bg-neutral-900 text-amber-400 shadow-xs'
                  : 'bg-white border border-neutral-200/80 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-neutral-200/80 text-center space-y-3">
          <ChefHat className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-neutral-800">No Orders in this view</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            New orders from customers and counter POS will automatically appear here with sound alert.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isUnpaid = order.status === 'AWAITING_PAYMENT';
            const isPaidOrPrep = order.status === 'PAID' || order.status === 'PREPARING';
            const isReady = order.status === 'READY';
            const isDone = order.status === 'COMPLETED';

            const elapsedMins = Math.floor(
              (currentTimeMs - new Date(order.createdAt).getTime()) / 60000
            );

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl bg-white border shadow-xs transition duration-200 ${
                  isReady
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : isUnpaid
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-[#EFF0F6]'
                }`}
              >
                {/* Card Top: Big Calling Token */}
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-neutral-950 font-black text-lg tracking-tight shadow-xs">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        {order.type === 'DINE_IN' ? `Table ${order.tableNumber || 1}` : 'Takeaway'}
                      </span>
                      <span className="text-xs font-bold text-neutral-800">
                        {order.customerName || 'Walk-in'}
                      </span>
                    </div>
                  </div>

                  {/* Elapsed Timer & Status */}
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isReady
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isPaidOrPrep
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : isUnpaid
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-[10px] text-neutral-400 font-medium mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{elapsedMins}m ago</span>
                    </p>
                  </div>
                </div>

                {/* Card Items List */}
                <div className="p-4 flex-1 space-y-2">
                  <div className="divide-y divide-neutral-100 text-xs">
                    {order.orderItems.map((item) => {
                      let parsedAddOns: Array<{ name: string }> = [];
                      try {
                        if (item.addOnsJson) parsedAddOns = JSON.parse(item.addOnsJson);
                      } catch {}

                      return (
                        <div key={item.id} className="py-1.5 flex items-start justify-between">
                          <div className="pr-2">
                            <p className="font-bold text-neutral-900">
                              <span className="text-amber-600 font-black mr-1">{item.quantity}x</span>
                              {item.itemName}
                            </p>
                            {item.variantName && (
                              <p className="text-[10px] text-neutral-500 font-semibold">
                                Size: {item.variantName}
                              </p>
                            )}
                            {parsedAddOns.length > 0 && (
                              <p className="text-[10px] text-amber-700 font-medium">
                                + {parsedAddOns.map((a) => a.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-neutral-700 shrink-0">
                            {formatPaise(item.subtotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cooking Note */}
                  {order.cookingNote && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                      <strong>Note:</strong> {order.cookingNote}
                    </div>
                  )}

                  {/* Payment Hint if unpaid */}
                  {isUnpaid && order.customerUtrHint && (
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium">
                      Customer UTR last 4 digits: <strong>{order.customerUtrHint}</strong>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Fast Actions */}
                <div className="p-3 bg-neutral-50/60 border-t border-neutral-100 flex flex-col gap-2">
                  {/* Primary Workflow Button */}
                  {isUnpaid && (
                    <button
                      onClick={() => setSelectedOrderForPayment(order)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirm Payment ({formatPaise(order.total)})</span>
                    </button>
                  )}

                  {order.status === 'PAID' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4 stroke-[2.5]" />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-4 h-4 stroke-[2.5]" />
                      <span>Mark Ready & Call Token</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakOrderCalling(order.orderNumber)}
                        className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-xs shadow-xs transition flex items-center justify-center gap-1"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>📢 Pukaro #{order.orderNumber}</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </button>
                    </div>
                  )}

                  {/* Print and Voice buttons */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200/50">
                    <span className="font-extrabold text-neutral-900">
                      Total: {formatPaise(order.total)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintSlip(order.id, 'KITCHEN')}
                        className="text-neutral-500 hover:text-neutral-900 font-bold flex items-center gap-1"
                        title="Print KOT Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>KOT</span>
                      </button>
                      <button
                        onClick={() => handlePrintSlip(order.id, 'CUSTOMER_BILL')}
                        className="text-neutral-500 hover:text-neutral-900 font-bold flex items-center gap-1"
                        title="Print Bill"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Bill</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {selectedOrderForPayment && (
        <MarkPaidModal
          order={selectedOrderForPayment}
          isOpen={true}
          onClose={() => setSelectedOrderForPayment(null)}
          onSuccess={() => {
            setSelectedOrderForPayment(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

