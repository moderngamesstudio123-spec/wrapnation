'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, UtensilsCrossed, ArrowRight, MessageSquare, QrCode } from 'lucide-react';
import TableSelectorModal from '@/components/customer/TableSelectorModal';

interface HomeActionClientProps {
  tables: Array<{
    tableNumber: number;
    signedToken: string;
  }>;
  shopPhone: string;
}

export default function HomeActionClient({ tables, shopPhone }: HomeActionClientProps) {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Clean phone number for WhatsApp wa.me link
  const cleanPhone = shopPhone.replace(/\D/g, '') || '918686878675';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hi Wrap Nation! I want to order food or view the menu.'
  )}`;

  return (
    <>
      <div className="space-y-3 max-w-sm mx-auto w-full">
        {/* 1. Takeaway Order */}
        <Link
          href="/takeaway"
          className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-base uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 group cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Order Takeaway</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* 2. Dine-In Table Picker */}
        <button
          onClick={() => setIsTableModalOpen(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 hover:border-amber-400 text-neutral-900 font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          <span>Dine-In (Select Table #)</span>
        </button>

        {/* 3. WhatsApp Entrance */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-xs"
        >
          <MessageSquare className="w-4 h-4 fill-emerald-600 text-emerald-600" />
          <span>Order / Inquire on WhatsApp</span>
        </a>
      </div>

      {/* Table Selector Modal */}
      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
      />
    </>
  );
}
