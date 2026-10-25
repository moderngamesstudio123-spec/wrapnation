'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/customer/cartContext';
import { UtensilsCrossed, Users, QrCode, ArrowRight, MessageSquare, Plus, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ActiveOrderInfo {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: string;
  total?: number;
}

interface TableTokenClientHandlerProps {
  token: string;
  tableNumber: number;
  activeOrder?: ActiveOrderInfo | null;
}

export default function TableTokenClientHandler({
  token,
  tableNumber,
  activeOrder,
}: TableTokenClientHandlerProps) {
  const router = useRouter();
  const { setTableInfo } = useCart();
  const [isSameDevice, setIsSameDevice] = useState<boolean | null>(null);

  useEffect(() => {
    if (!activeOrder) {
      // Table is vacant: activate session & redirect to menu
      setTableInfo(token, tableNumber);
      const timer = setTimeout(() => {
        router.replace('/menu');
      }, 600);
      return () => clearTimeout(timer);
    }

    // Check if this device placed the active order
    try {
      const hasSession =
        sessionStorage.getItem(`wrapnation_order_${activeOrder.id}`) ||
        localStorage.getItem(`wrapnation_order_${activeOrder.id}`) ||
        localStorage.getItem('wrapnation_last_table_order') === activeOrder.id;

      setIsSameDevice(!!hasSession);
    } catch {
      setIsSameDevice(false);
    }
  }, [token, tableNumber, activeOrder, router, setTableInfo]);

  // Loading state while checking occupancy
  if (activeOrder && isSameDevice === null) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-md animate-pulse">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <p className="text-xs text-neutral-500 font-semibold mt-3">Checking table occupancy...</p>
      </div>
    );
  }

  // Case 1: Table is occupied, but this device placed the running order
  if (activeOrder && isSameDevice) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-amber-200/90 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <UtensilsCrossed className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
              Your Table is Active
            </span>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Table #{tableNumber} Running
            </h1>
            <p className="text-xs text-neutral-500">
              You have an active dining order: <span className="font-black text-neutral-900">Order #{activeOrder.orderNumber}</span>
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={`/order/${activeOrder.id}`}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Track Order & View Bill</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setTableInfo(token, tableNumber);
                router.replace('/menu');
              }}
              className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add More Items to This Table</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Table is occupied by another guest (Different phone / stranger scan)
  if (activeOrder && !isSameDevice) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-rose-200/90 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Table Full / Occupied</span>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Table #{tableNumber} is Currently Occupied
            </h1>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Guests are currently seated and dining at this table (Order #{activeOrder.orderNumber}). To prevent order mix-ups, new dine-in orders on this table are currently locked.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-left text-xs space-y-1.5 text-neutral-700">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>What should you do?</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              • If you are seated at a different table, please scan your own table&apos;s QR sticker.<br />
              • Or speak with our counter staff to clear or assign you a table.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <Link
              href="/takeaway"
              className="w-full py-3.5 px-6 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Order as Takeaway Instead</span>
            </Link>

            <a
              href={`https://wa.me/918686878675?text=${encodeURIComponent(
                `Hi Wrap Nation! Table #${tableNumber} is showing occupied. Could you please assist me?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Ask Counter Staff on WhatsApp</span>
            </a>

            {/* In case user is part of the same party sitting at this table */}
            <button
              onClick={() => {
                setTableInfo(token, tableNumber);
                router.replace('/menu');
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 underline font-semibold cursor-pointer pt-1"
            >
              I am seated with Table #{tableNumber} guests (Join & Order)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Table is free - standard smooth verification redirect
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-md animate-bounce">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Table #{tableNumber} Verified</h1>
        <p className="text-sm text-neutral-500">
          Welcome to Wrap Nation! Loading your menu...
        </p>
      </div>
    </div>
  );
}
