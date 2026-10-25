import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ShoppingBag, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { getSettings } from '@/server/services/settingService';

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-amber-400 selection:text-neutral-950">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">Wrap Nation</span>
            <span className="text-amber-400 font-black text-xl">⚡</span>
          </div>

          <Link
            href="/login"
            className="text-xs font-bold text-neutral-400 hover:text-white py-1.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
          >
            Staff Login →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-xl mx-auto px-4 py-12 sm:py-20 text-center space-y-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold">
            <span>Fresh • Crispy • Fast</span>
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Order Fast. <br />
            <span className="text-amber-400">Eat Fresh.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed">
            Scan your table QR code to explore our Swiggy-style menu, order directly from your phone, and enjoy hot wraps & burgers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-sm mx-auto">
          <Link
            href="/takeaway"
            className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-base uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 group"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Order Takeaway</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/menu"
            className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-sm tracking-wide transition flex items-center justify-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <span>Browse Full Menu</span>
          </Link>
        </div>

        {/* Security & Dine-in Notice */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-850 text-xs text-neutral-400 text-left space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Dine-in Customers:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Please scan the QR code sticker placed on your table with your phone camera. Your table number will be automatically verified with cryptographic security.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-neutral-900 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} {settings.shopName}. All rights reserved.</p>
        <p className="text-[11px] text-neutral-600 mt-1">{settings.shopAddress}</p>
      </footer>
    </div>
  );
}
