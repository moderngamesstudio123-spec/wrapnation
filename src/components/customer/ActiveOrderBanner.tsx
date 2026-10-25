'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChefHat, ArrowRight, Clock, Bell, CheckCircle2 } from 'lucide-react';

interface ActiveOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalFormatted?: string;
  customerName?: string;
}

export default function ActiveOrderBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem('wrapnation_active_order');
        let orderId = localStorage.getItem('wrapnation_active_order_id');

        let parsed: ActiveOrder | null = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {}
        }

        if (!orderId && parsed?.id) {
          orderId = parsed.id;
        }

        if (!orderId) {
          setActiveOrder(null);
          return;
        }

        // Show local cached preview immediately
        if (parsed && !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(parsed.status)) {
          setActiveOrder(parsed);
        }

        // Refresh latest status from server
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const serverOrder = data.order;
          if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(serverOrder.status)) {
            // Order has finished, clear active banner
            localStorage.removeItem('wrapnation_active_order');
            localStorage.removeItem('wrapnation_active_order_id');
            setActiveOrder(null);
          } else {
            const updated = {
              id: serverOrder.id,
              orderNumber: serverOrder.orderNumber,
              status: serverOrder.status,
              totalFormatted: serverOrder.totalFormatted,
              customerName: serverOrder.customerName,
            };
            localStorage.setItem('wrapnation_active_order', JSON.stringify(updated));
            setActiveOrder(updated);
          }
        }
      } catch {}
    };

    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!activeOrder) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return {
          label: 'FOOD READY! PLEASE PICK UP 🔔',
          bg: 'bg-emerald-500 text-white border-emerald-600',
          icon: Bell,
          animate: 'animate-bounce',
        };
      case 'PREPARING':
        return {
          label: 'Kitchen Preparing Your Food',
          bg: 'bg-amber-400 text-neutral-950 border-amber-500',
          icon: ChefHat,
          animate: '',
        };
      case 'PAID':
        return {
          label: 'Payment Confirmed',
          bg: 'bg-blue-500 text-white border-blue-600',
          icon: CheckCircle2,
          animate: '',
        };
      default:
        return {
          label: 'Awaiting Payment Confirmation',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
          animate: '',
        };
    }
  };

  const badge = getStatusBadge(activeOrder.status);
  const Icon = badge.icon;

  return (
    <div className="w-full px-4 pt-2 pb-1 z-30">
      <Link
        href={`/order/${activeOrder.id}`}
        className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${badge.bg} ${badge.animate}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight uppercase">
                Active Order #{activeOrder.orderNumber}
              </span>
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            </div>
            <p className="text-[11px] font-bold opacity-90 truncate">
              {badge.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition">
          <span>Track</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </div>
  );
}
