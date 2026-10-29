'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Calculator,
  Printer,
  LogOut,
  Store,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: 'OWNER' | 'STAFF';
  };
  onToggleSidebar: () => void;
}

export default function AdminHeader({ user, onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const [printerOnline, setPrinterOnline] = useState<boolean>(false);
  const [pendingPrintJobs, setPendingPrintJobs] = useState<number>(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

  return (
    <header className="no-print h-16 sticky top-0 z-30 bg-white border-b border-[#EFF0F6] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Sidebar toggle & Branch badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/80 border border-neutral-200/60 text-xs font-medium text-neutral-700">
          <Store className="w-3.5 h-3.5 text-amber-500" />
          <span>Outlet:</span>
          <span className="font-bold text-neutral-900">Wrap Nation Express</span>
        </div>
      </div>

      {/* Right actions: POS quick button, Printer status, User dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick POS Button */}
        <Link
          href="/admin/billing"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-xs shadow-xs transition"
        >
          <Calculator className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden md:inline">Open POS</span>
        </Link>

        {/* Printer Status Badge */}
        <div
          title={printerOnline ? 'Thermal printer online' : 'Thermal printer offline'}
          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border ${
            printerOnline
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-neutral-100 border-neutral-200 text-neutral-500'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {printerOnline ? 'Printer Online' : 'Printer Offline'}
          </span>
          {pendingPrintJobs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
              {pendingPrintJobs}
            </span>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <span className="block text-xs font-bold text-neutral-900 leading-tight">
                {user.name}
              </span>
              <span className="block text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#EFF0F6] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 border-b border-neutral-100 mb-1">
                <p className="text-xs font-bold text-neutral-900">{user.name}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Admin Access</span>
                </div>
              </div>

              <Link
                href="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition"
              >
                <UserIcon className="w-4 h-4 text-neutral-400" />
                <span>Store Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

