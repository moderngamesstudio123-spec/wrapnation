'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calculator,
  UtensilsCrossed,
  BarChart3,
  QrCode,
  Settings,
  LogOut,
  Printer,
  Radio,
} from 'lucide-react';

interface AdminNavProps {
  user: {
    name: string;
    email: string;
    role: 'OWNER' | 'STAFF';
  };
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [printerOnline, setPrinterOnline] = useState<boolean>(false);
  const [pendingPrintJobs, setPendingPrintJobs] = useState<number>(0);

  // Poll printer status
  useEffect(() => {
    const checkPrinter = async () => {
      try {
        const res = await fetch('/api/printer/status');
        if (res.ok) {
          const data = await res.json();
          setPrinterOnline(data.online);
          setPendingPrintJobs(data.pendingJobs || 0);
        }
      } catch {}
    };

    checkPrinter();
    const interval = setInterval(checkPrinter, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Live Orders', icon: LayoutDashboard },
    { href: '/admin/billing', label: 'Walk-in Billing', icon: Calculator },
    { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
    ...(user.role === 'OWNER'
      ? [{ href: '/admin/reports', label: 'Reports', icon: BarChart3 }]
      : []),
    { href: '/admin/tables', label: 'Table QRs', icon: QrCode },
    ...(user.role === 'OWNER'
      ? [{ href: '/admin/settings', label: 'Settings', icon: Settings }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Printer status */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-black text-lg text-neutral-950 tracking-tight">Wrap Nation</span>
            <span className="text-neutral-950 font-black text-[11px] bg-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
              POS
            </span>
          </Link>

          {/* Printer Status Badge */}
          <div
            title={
              printerOnline
                ? 'Print agent connected and ready'
                : 'Print agent offline (browser print fallback active)'
            }
            className={`hidden md:flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border ${
              printerOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{printerOnline ? 'Printer Agent Online' : 'Printer Offline'}</span>
            {pendingPrintJobs > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px]">
                {pendingPrintJobs}
              </span>
            )}
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 shadow-xs font-black'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-amber-50/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-neutral-900 leading-tight">{user.name}</div>
            <div className="text-[10px] text-amber-700 font-mono font-bold uppercase tracking-wider">
              {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Links Row */}
      <div className="lg:hidden px-4 py-2 border-t border-amber-100 bg-[#FAF7F2] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 shadow-xs font-black'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
