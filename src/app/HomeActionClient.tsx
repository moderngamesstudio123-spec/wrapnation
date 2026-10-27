'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, MessageSquare, Flame } from 'lucide-react';

interface HomeActionClientProps {
  shopPhone: string;
}

export default function HomeActionClient({ shopPhone }: HomeActionClientProps) {
  // Clean phone number for WhatsApp wa.me link
  const cleanPhone = shopPhone.replace(/\D/g, '') || '918125057086';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hi Wrap Nation! I want to view the menu and order fresh wraps.'
  )}`;

  return (
    <div className="space-y-3 max-w-sm mx-auto w-full">
      {/* 1. Primary Digital Menu & Order Button */}
      <Link
        href="/menu"
        className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-base uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 group cursor-pointer"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>View Menu & Order</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* 2. WhatsApp Entrance */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 px-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-xs"
      >
        <MessageSquare className="w-4 h-4 fill-emerald-600 text-emerald-600" />
        <span>Order / Chat on WhatsApp</span>
      </a>
    </div>
  );
}

