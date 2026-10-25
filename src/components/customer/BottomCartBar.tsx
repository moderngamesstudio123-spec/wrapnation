'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/customer/cartContext';
import { formatPaise } from '@/lib/format';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function BottomCartBar() {
  const { totalItemsCount, subtotalPaise } = useCart();

  if (totalItemsCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <Link
          href="/cart"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 shadow-xl border border-amber-300 transition duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-950/15 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-wide">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in cart
              </div>
              <div className="text-xs font-semibold text-neutral-900/80">
                Subtotal: {formatPaise(subtotalPaise)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider bg-neutral-950 text-amber-400 px-4 py-2 rounded-xl group-hover:translate-x-0.5 transition-transform">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>
      </div>
    </div>
  );
}
