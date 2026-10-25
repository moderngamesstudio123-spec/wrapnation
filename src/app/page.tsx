import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ShoppingBag, ArrowRight, ShieldCheck, QrCode, Star, Flame } from 'lucide-react';
import { getSettings } from '@/server/services/settingService';
import { signTableToken } from '@/lib/security/hmac';
import HomeActionClient from './HomeActionClient';

export default async function HomePage() {
  const settings = await getSettings();

  // Generate table tokens for tables 1 to tablesCount
  const tablesCount = settings.tablesCount || 12;
  const tables = [];
  for (let i = 1; i <= tablesCount; i++) {
    tables.push({
      tableNumber: i,
      signedToken: signTableToken(i),
    });
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col justify-between selection:bg-amber-400 selection:text-neutral-950">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-neutral-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-neutral-950 uppercase font-sans">
              Wrap <span className="text-amber-500">Nation</span>
            </span>
            <span className="text-amber-500 font-black text-xl">⚡</span>
          </div>

          <Link
            href="/login"
            className="text-xs font-bold text-neutral-700 hover:text-neutral-950 py-1.5 px-3 rounded-xl bg-white border border-neutral-300 hover:border-neutral-400 shadow-xs transition"
          >
            Staff Login →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-xl mx-auto px-4 py-8 sm:py-14 text-center space-y-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-black tracking-wide">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>AUTHENTIC WRAPS • CRISPY BURGERS • FRIED CHICKEN</span>
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-950 leading-tight">
            Craving Something <br />
            <span className="text-amber-500">Crispy & Fresh?</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Order directly from your phone just like Swiggy & Zomato. Pay via PhonePe / GPay QR or Cash at counter.
          </p>
        </div>

        {/* Food Teaser Grid (Swiggy Style Cards) */}
        <div className="grid grid-cols-3 gap-3 text-left">
          {/* Card 1: Wraps */}
          <Link
            href="/menu"
            className="p-2 sm:p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-amber-400 shadow-xs hover:shadow-md transition group block"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-2 border border-neutral-200">
              <img
                src="/images/food/wrap.jpg"
                alt="Chicken Wrap"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-xs font-black text-neutral-900 leading-tight truncate">Wraps</p>
            <p className="text-[10px] text-amber-600 font-bold">from Rs 120</p>
          </Link>

          {/* Card 2: Burgers */}
          <Link
            href="/menu"
            className="p-2 sm:p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-amber-400 shadow-xs hover:shadow-md transition group block"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-2 border border-neutral-200">
              <img
                src="/images/food/burger.jpg"
                alt="Zinger Burger"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-xs font-black text-neutral-900 leading-tight truncate">Burgers</p>
            <p className="text-[10px] text-amber-600 font-bold">from Rs 70</p>
          </Link>

          {/* Card 3: Fried Chicken */}
          <Link
            href="/menu"
            className="p-2 sm:p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-amber-400 shadow-xs hover:shadow-md transition group block"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-2 border border-neutral-200">
              <img
                src="/images/food/fried-chicken.jpg"
                alt="Fried Chicken"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-xs font-black text-neutral-900 leading-tight truncate">Fried Chicken</p>
            <p className="text-[10px] text-amber-600 font-bold">from Rs 220</p>
          </Link>
        </div>

        {/* Action Client: Takeaway, Table Selector Modal, and WhatsApp */}
        <HomeActionClient tables={tables} shopPhone={settings.shopPhone} />

        {/* Dine-in Guidance Notice */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 text-left space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-900 font-bold">
            <QrCode className="w-4 h-4 text-amber-600" />
            <span>Table QR Code Scanner:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            If you are seated at Wrap Nation, scan the QR sticker on your table with your phone camera or tap &ldquo;Dine-In (Select Table #)&rdquo; above.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-neutral-200 text-center text-xs text-neutral-500 bg-white">
        <p>© {new Date().getFullYear()} {settings.shopName}. All rights reserved.</p>
        <p className="text-[11px] text-neutral-500 mt-1">{settings.shopAddress}</p>
      </footer>
    </div>
  );
}
