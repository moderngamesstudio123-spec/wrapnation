'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MessageSquare,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
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
  const [customerRating, setCustomerRating] = useState<number>(0);

  // Phone Ring & Beep notification state
  const [isRinging, setIsRinging] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedReadyAlertRef = useRef<boolean>(false);

  // Pleasant restaurant bell chime synthesizer (pure Web Audio API, zero dependencies)
  const playPickupRingSound = useCallback(() => {
    if (soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Chord 1: Gentle energetic chime (D5 -> A5 -> D6)
      const notes = [
        { freq: 587.33, start: 0.0, dur: 0.35, gain: 0.35 },  // D5
        { freq: 880.00, start: 0.16, dur: 0.4, gain: 0.4 },   // A5
        { freq: 1174.66, start: 0.35, dur: 0.65, gain: 0.45 }, // D6
      ];

      notes.forEach(({ freq, start, dur, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(gain, now + start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });

      // Chord 2: Bright sparkling echo burst
      const echoNotes = [
        { freq: 880.00, start: 0.8, dur: 0.3, gain: 0.35 },
        { freq: 1396.91, start: 0.95, dur: 0.7, gain: 0.45 },
      ];

      echoNotes.forEach(({ freq, start, dur, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(gain, now + start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });

      // Mobile phone physical vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    } catch (e) {
      console.warn('Audio ring playback error:', e);
    }
  }, [soundMuted]);

  const triggerReadyAlert = useCallback(() => {
    if (hasPlayedReadyAlertRef.current) return;
    hasPlayedReadyAlertRef.current = true;
    setIsRinging(true);
    playPickupRingSound();

    // Repeat chime sequence 3 times every 3.5 seconds so customer doesn't miss it
    let ringsCount = 1;
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(() => {
      ringsCount++;
      if (ringsCount >= 3) {
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        setIsRinging(false);
      } else {
        playPickupRingSound();
      }
    }, 3500);
  }, [playPickupRingSound]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      if (!res.ok) {
        // Fallback to client cached order if serverless lambda has not synced
        let cachedOrder: any = null;
        try {
          const raw = sessionStorage.getItem(`wrapnation_order_${orderId}`) || localStorage.getItem(`wrapnation_order_${orderId}`);
          if (raw) {
            cachedOrder = JSON.parse(raw);
          }
        } catch {}

        if (cachedOrder) {
          setOrder({
            ...cachedOrder,
            subtotalFormatted: cachedOrder.subtotalFormatted || `Rs ${Math.round(cachedOrder.subtotal / 100)}`,
            taxFormatted: cachedOrder.taxFormatted || `Rs ${Math.round(cachedOrder.tax / 100)}`,
            totalFormatted: cachedOrder.totalFormatted || `Rs ${Math.round(cachedOrder.total / 100)}`,
            orderItems: (cachedOrder.orderItems || []).map((i: any) => ({
              ...i,
              unitPriceFormatted: i.unitPriceFormatted || `Rs ${Math.round(i.unitPrice / 100)}`,
              subtotalFormatted: i.subtotalFormatted || `Rs ${Math.round(i.subtotal / 100)}`,
              addOns: i.addOns || [],
            })),
          });
          setShop({
            name: 'Wrap Nation',
            address: '8-4, 549/48, AG Colony Rd, Erragadda, Hyderabad, Telangana 500038',
            phone: '+91 81250 57086',
            gstin: null,
          });
          setError(null);
          return;
        }

        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data.order);
      setUpiData(data.upiPaymentData);
      setShop(data.shop);
      // Sync active order state in localStorage so back button or reload never loses it
      if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(data.order.status)) {
        localStorage.removeItem('wrapnation_active_order');
        localStorage.removeItem('wrapnation_active_order_id');
      } else {
        localStorage.setItem('wrapnation_active_order', JSON.stringify({
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          status: data.order.status,
          totalFormatted: data.order.totalFormatted,
          customerName: data.order.customerName,
        }));
        localStorage.setItem('wrapnation_active_order_id', data.order.id);
      }
      if (data.order?.customerUtrHint) {
        setUtrHintInput(data.order.customerUtrHint);
        setHintSubmitted(true);
      }

      // If order is ready, sound the chime!
      if (data.order?.status === 'READY') {
        triggerReadyAlert();
      }
    } catch (err: unknown) {
      // If error occurred, check client cache one more time before showing error
      try {
        const raw = sessionStorage.getItem(`wrapnation_order_${orderId}`) || localStorage.getItem(`wrapnation_order_${orderId}`);
        if (raw) {
          const cachedOrder = JSON.parse(raw);
          setOrder({
            ...cachedOrder,
            subtotalFormatted: cachedOrder.subtotalFormatted || `Rs ${Math.round(cachedOrder.subtotal / 100)}`,
            taxFormatted: cachedOrder.taxFormatted || `Rs ${Math.round(cachedOrder.tax / 100)}`,
            totalFormatted: cachedOrder.totalFormatted || `Rs ${Math.round(cachedOrder.total / 100)}`,
            orderItems: (cachedOrder.orderItems || []).map((i: any) => ({
              ...i,
              unitPriceFormatted: i.unitPriceFormatted || `Rs ${Math.round(i.unitPrice / 100)}`,
              subtotalFormatted: i.subtotalFormatted || `Rs ${Math.round(i.subtotal / 100)}`,
              addOns: i.addOns || [],
            })),
          });
          setShop({
            name: 'Wrap Nation',
            address: '8-4, 549/48, AG Colony Rd, Erragadda, Hyderabad, Telangana 500038',
            phone: '+91 81250 57086',
            gstin: null,
          });
          setError(null);
          return;
        }
      } catch {}

      const msg = err instanceof Error ? err.message : 'Failed to load order';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId, triggerReadyAlert]);

  useEffect(() => {
    fetchOrder();

    // Auto-unlock AudioContext on first tap/touch
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioContextRef.current && AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        setAudioUnlocked(true);
      } catch {}
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // Connect to Server-Sent Events for real-time live updates
    const eventSource = new EventSource(`/api/orders/stream?orderId=${orderId}`);

    eventSource.addEventListener('ORDER_STATUS_CHANGED', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : null));
        if (payload.status === 'READY') {
          triggerReadyAlert();
        }
      } catch {}
    });

    eventSource.addEventListener('PAYMENT_CONFIRMED', () => {
      fetchOrder();
    });

    eventSource.onerror = () => {
      // Re-fetch fallback on error
      fetchOrder();
    };

    // Periodic poll fallback every 4.5 seconds for instant detection
    const interval = setInterval(fetchOrder, 4500);

    return () => {
      eventSource.close();
      clearInterval(interval);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [orderId, fetchOrder, triggerReadyAlert]);

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
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-xl font-bold text-rose-600">Unable to find order</h2>
          <p className="text-sm text-neutral-600">{error || 'Please check your order link.'}</p>
          <Link
            href="/menu"
            className="inline-flex py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm shadow-sm transition"
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
    <div className="min-h-screen bg-neutral-950 flex justify-center selection:bg-amber-400 selection:text-neutral-950">
      <div className="w-full max-w-md min-h-screen bg-[#FAF7F2] text-neutral-900 pb-20 relative shadow-2xl border-x border-neutral-200/60 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200/80 p-3.5 sticky top-0 z-30 shadow-xs no-print">
          <div className="flex items-center justify-between">
            <Link
              href="/menu"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-black text-amber-950 transition shadow-2xs"
            >
              <span>← Back to Menu</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-bold text-neutral-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
          </div>
        </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* Interactive Screen Cards (Hidden during Print) */}
        <div className="no-print space-y-6">
        {/* Ringing Sound Banner when order is READY */}
        {isReady && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg space-y-3 border-2 border-emerald-300 ring-4 ring-emerald-400/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center ${isRinging ? 'animate-bounce' : ''}`}>
                  <Bell className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    YOUR ORDER IS PACKED & READY! 🌯
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    {isRinging ? '🔔 Ringing chime... Please collect from the counter!' : 'Ready at counter. Enjoy your meal!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isRinging ? (
                  <button
                    onClick={() => {
                      setIsRinging(false);
                      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white text-emerald-950 font-black text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    Mute Chime
                  </button>
                ) : (
                  <button
                    onClick={() => playPickupRingSound()}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Re-Ring</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reassuring Sound Indicator while awaiting food */}
        {!isReady && !isCompleted && !isCancelled && (
          <div className="p-3 px-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-amber-950">
                Phone ring alert active: Phone will beep when wrap is packed.
              </span>
            </div>
            <button
              onClick={() => {
                playPickupRingSound();
                setAudioUnlocked(true);
              }}
              className="py-1 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-black text-[11px] shadow-2xs hover:bg-amber-100/60 active:scale-95 transition cursor-pointer shrink-0"
            >
              Test Ring 🔔
            </button>
          </div>
        )}

        {/* 1. Big Order Number Token Card */}
        <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 text-center space-y-3 shadow-sm">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
            {order.customerName ? (
              <>
                <span className="text-amber-500 font-black">👤</span>
                <span>Customer: {order.customerName}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>Wrap Nation Order</span>
              </>
            )}
          </div>

          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-widest block font-bold">
              Your Order Calling Number
            </span>
            <div className="text-5xl font-black text-amber-500 tracking-tight mt-1">
              Order #{order.orderNumber}
            </div>
            <p className="text-xs text-neutral-600 font-bold mt-1.5">
              📢 Staff will call out <span className="text-neutral-950 font-black underline">Order #{order.orderNumber}</span> when food is packed!
            </p>
          </div>

          {/* Status Badge */}
          <div>
            {isAwaitingPayment && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-black uppercase tracking-wider animate-pulse">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Awaiting Payment Confirmation</span>
              </span>
            )}
            {isPreparing && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <ChefHat className="w-4 h-4 text-emerald-600" />
                <span>Preparing in Kitchen</span>
              </span>
            )}
            {isReady && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-sm animate-bounce">
                <Bell className="w-4 h-4" />
                <span>Order Ready! Please Collect</span>
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black uppercase tracking-wider shadow-xs">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Order Completed & Delivered! 🌯</span>
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-xs font-black uppercase tracking-wider">
                <span>Order {order.status}</span>
              </span>
            )}
          </div>
        </div>

        {/* Order Delivered Celebration Card */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md text-center space-y-2">
            <div className="text-2xl">🎉🌯</div>
            <h3 className="text-base font-black">Food Delivered! Enjoy Your Meal!</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Thank you for ordering with Wrap Nation. Need extra dips, drinks, or another wrap?
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <a
                href="/menu"
                className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs shadow-xs transition"
              >
                Order More ⚡
              </a>
              <a
                href="https://share.google/K02BROH8ES5iuiEmh"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition"
              >
                ⭐ Rate on Google
              </a>
            </div>
          </div>
        )}

        {/* Instant WhatsApp Order Updates & Live Tracking Card */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
              💬
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950 leading-tight">
                Live WhatsApp Tracking
              </h4>
              <p className="text-[11px] text-emerald-700 font-medium">
                Receipt & live link sent to WhatsApp for {order.customerPhone ? `+91 ${order.customerPhone}` : 'your phone'}.
              </p>
            </div>
          </div>

          <a
            href={`https://api.whatsapp.com/send?phone=${(shop?.phone || '918125057086').replace(/\D/g, '')}&text=${encodeURIComponent(
              `🌯 *Wrap Nation — Order #${order.orderNumber}* ⚡\n\nHi Wrap Nation! My order details:\n👤 *Customer:* ${order.customerName || 'Customer'}\n📱 *Phone:* ${order.customerPhone || ''}\n🔢 *Order Number:* #${order.orderNumber}\n💰 *Amount:* ${order.totalFormatted} (${order.paymentMethod})\n📍 *Track Live Status & View Bill:*\n${typeof window !== 'undefined' ? window.location.href : `https://wrapnation.vercel.app/order/${order.id}`}\n\nStaff will call out *Order #${order.orderNumber}* when food is ready!\nThank you for ordering with Wrap Nation!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <span>Open Order in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2. Step Progress Bar */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Step 1: Received */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  order ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                1
              </div>
              <span className="text-[11px] font-bold block text-neutral-600">
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
                    ? 'border-2 border-amber-500 text-amber-600 animate-pulse'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                2
              </div>
              <span className="text-[11px] font-bold block text-neutral-600">
                Payment
              </span>
            </div>

            {/* Step 3: Preparing */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  isPreparing || isReady || isCompleted
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-bold block text-neutral-600">
                Kitchen
              </span>
            </div>

            {/* Step 4: Ready */}
            <div className="space-y-1.5">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  isReady || isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                4
              </div>
              <span className="text-[11px] font-bold block text-neutral-600">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Feature 2: Live WhatsApp Status & Direct Chat Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                <span>WhatsApp Live Updates</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-neutral-600">
                {isReady
                  ? '🎉 Food is ready! Please collect at counter.'
                  : isPreparing
                  ? '👨‍🍳 Kitchen is preparing your order fresh.'
                  : '⏳ Waiting for counter to verify payment.'}
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/${(shop?.phone || '918686878675').replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hi Wrap Nation! My order token is ${orderTokenLabel} (${order.type}). Please send me live updates.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-xs transition"
          >
            Chat
          </a>
        </div>

        {/* 3. Awaiting Payment Section (Direct UPI QR / Cash instructions) */}
        {isAwaitingPayment && (
          <div className="p-6 rounded-3xl bg-white border-2 border-amber-400/60 space-y-6 shadow-md">
            {order.paymentMethod === 'UPI' && upiData ? (
              <div className="text-center space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-neutral-900">Scan to Pay via UPI</h3>
                  <p className="text-xs text-neutral-500">
                    Use PhonePe, Google Pay, Paytm, or any UPI app
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#5f259f]/10 border border-[#5f259f]/30 text-[#5f259f] font-black text-[11px] tracking-wide">
                      PhonePe
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-black text-[11px] tracking-wide">
                      Google Pay
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-black text-[11px] tracking-wide">
                      Paytm
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-black text-[11px] tracking-wide">
                      BHIM UPI
                    </span>
                  </div>
                </div>

                {/* Amount to Pay */}
                <div className="py-2.5 px-6 rounded-2xl bg-amber-50 border border-amber-300 inline-block">
                  <span className="text-xs text-neutral-600 block font-medium">Exact Amount to Pay</span>
                  <span className="text-3xl font-black text-amber-600">
                    {order.totalFormatted}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl inline-block shadow-sm">
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
                <div className="text-xs text-neutral-600 space-y-0.5">
                  <p className="text-neutral-900 font-bold">{upiData.payeeName}</p>
                  <p className="font-mono text-amber-600 font-semibold">{upiData.upiId}</p>
                </div>

                {/* Open UPI App Deep Link Button */}
                <div>
                  <a
                    href={upiData.deepLink}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-sm transition w-full"
                  >
                    <span>Open in UPI App</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Optional Customer UTR Hint Form */}
                <div className="pt-4 border-t border-neutral-200 text-left space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Paid? Enter last 4 digits of UPI Ref / UTR (Optional hint for staff)
                  </label>
                  <form onSubmit={handleSubmitHint} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4821"
                      value={utrHintInput}
                      onChange={(e) => setUtrHintInput(e.target.value.replace(/\D/g, ''))}
                      className="w-32 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono text-sm text-center focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={submittingHint || utrHintInput.length !== 4}
                      className="py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {submittingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Save Hint</span>
                    </button>
                  </form>
                  {hintSubmitted && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hint recorded for counter staff verification.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-neutral-900">Pay at Counter (Cash)</h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  Please show your order token <strong className="text-amber-600">{orderTokenLabel}</strong> and pay <strong className="text-neutral-900">{order.totalFormatted}</strong> in cash at the counter.
                </p>
              </div>
            )}

            {/* Crucial Security Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-neutral-600 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Security Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Orders move to the kitchen only after staff confirms payment on the shop soundbox or business app. No button can mark an order paid.
              </p>
            </div>
          </div>
        )}

        {/* 4. Itemized Digital Receipt Card */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 space-y-4 text-xs shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h4 className="font-bold text-sm text-neutral-900">{shop?.name || 'Wrap Nation'}</h4>
              <p className="text-neutral-500 text-[11px]">{shop?.address}</p>
              {shop?.gstin && <p className="text-neutral-500 text-[11px]">GSTIN: {shop.gstin}</p>}
            </div>
            <div className="text-right">
              <span className="font-bold text-neutral-900 block">Token: {orderTokenLabel}</span>
              <span className="text-neutral-500 text-[11px]">
                {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="divide-y divide-neutral-100">
            {order.orderItems.map((item) => (
              <div key={item.id} className="py-2 flex items-start justify-between">
                <div>
                  <span className="font-bold text-neutral-900">
                    {item.itemName} × {item.quantity}
                  </span>
                  {item.variantName && (
                    <div className="text-[11px] text-amber-600 font-medium">• {item.variantName}</div>
                  )}
                  {item.addOns.length > 0 && (
                    <div className="text-[11px] text-neutral-500">
                      {item.addOns.map((a) => `+ ${a.name}`).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-bold text-neutral-900">{item.subtotalFormatted}</span>
              </div>
            ))}
          </div>

          {/* Subtotal, Tax, Total */}
          <div className="border-t border-neutral-200 pt-3 space-y-1">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{order.subtotalFormatted}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>GST Tax</span>
                <span>{order.taxFormatted}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-neutral-900 pt-1 border-t border-neutral-200">
              <span>Total Amount</span>
              <span className="text-amber-600">{order.totalFormatted}</span>
            </div>
            <div className="flex justify-between text-neutral-500 text-[11px] pt-1">
              <span>Payment Mode</span>
              <span className="uppercase font-semibold text-neutral-700">
                {order.paymentMethod} • {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp Slip & Print */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-neutral-200">
            <a
              href={`https://wa.me/${(shop?.phone || '918686878675').replace(/\D/g, '')}?text=${encodeURIComponent(
                `*Wrap Nation Order Receipt*\nOrder Token: ${orderTokenLabel}\nType: ${order.type}\nTotal: ${order.totalFormatted}\nPayment: ${order.paymentMethod} (${order.paymentStatus})\n\nItems:\n${order.orderItems.map((i) => `• ${i.itemName} x${i.quantity} (${i.subtotalFormatted})`).join('\n')}\n\nTrack order: ${typeof window !== 'undefined' ? window.location.href : ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 text-center"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Share Slip on WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 text-neutral-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Print 80mm Slip</span>
            </button>

            <a
              href="https://share.google/K02BROH8ES5iuiEmh"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>📍 View on Google Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Feature 6: Google Maps Review Booster */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 text-center space-y-3 shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-amber-500">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                How was your food & experience?
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Tap stars to rate Wrap Nation
            </p>
          </div>

          {/* 5 Interactive Stars */}
          <div className="flex items-center justify-center gap-2.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCustomerRating(star)}
                className="text-3xl transition-transform active:scale-125 hover:scale-110 cursor-pointer"
                aria-label={`Rate ${star} star`}
              >
                {customerRating >= star ? '⭐' : '☆'}
              </button>
            ))}
          </div>

          {/* 4 or 5 Stars -> Google Review Booster Link */}
          {customerRating >= 4 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2 text-center">
              <p className="text-xs font-bold text-neutral-900">
                🎉 Thank you so much! Please take 10 seconds to share your review on Google Maps.
              </p>
              <a
                href="https://share.google/K02BROH8ES5iuiEmh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-sm transition"
              >
                <Star className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Review on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* 1, 2, or 3 Stars -> Private Feedback to Shop Owner */}
          {customerRating > 0 && customerRating <= 3 && (
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-left">
              <p className="text-xs text-neutral-700 font-medium">
                We are sorry your experience was not perfect! Please message the shop owner directly so we can resolve it immediately:
              </p>
              <a
                href={`https://wa.me/${(shop?.phone || '918686878675').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi Wrap Nation Owner, I have feedback regarding Order ${orderTokenLabel}: `
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Message Owner on WhatsApp</span>
              </a>
            </div>
          )}
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
    </div>
  );
}
