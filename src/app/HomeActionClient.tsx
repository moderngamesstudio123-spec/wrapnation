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
  const cleanPhone = shopPhone.replace(/\D/g, '') || '919876543210';
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
          className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 text-white font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          <span>Dine-In (Select Table #)</span>
        </button>

        {/* 3. WhatsApp Entrance */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-6 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-sm"
        >
          <MessageSquare className="w-4 h-4 fill-emerald-400" />
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
