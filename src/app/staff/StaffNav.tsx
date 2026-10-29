'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, LogOut, Radio, User } from 'lucide-react';

interface StaffNavProps {
  user: {
    name: string;
    email: string;
    role: 'OWNER' | 'STAFF';
  };
}

export default function StaffNav({ user }: StaffNavProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };

  return (
    <header className="no-print h-16 sticky top-0 z-40 bg-white border-b border-[#EFF0F6] px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand & Station */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow-xs">
          <ChefHat className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-tight text-neutral-950">
              Wrap Nation
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-900 text-amber-400">
              Staff Kitchen
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium">Live Order Dispatch Station</p>
        </div>
      </div>

      {/* Staff profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-neutral-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">{user.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

