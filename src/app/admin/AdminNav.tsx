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
    <header className="sticky top-0 z-40 bg-neutral-900 border-b border-neutral-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Printer status */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-black text-lg text-white tracking-tight">Wrap Nation</span>
            <span className="text-amber-400 font-bold text-xs bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
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
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
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
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
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
            <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
            <div className="text-[10px] text-amber-400/90 font-mono font-medium">
              {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Links Row */}
      <div className="lg:hidden px-4 py-2 border-t border-neutral-850 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
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
