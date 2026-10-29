'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calculator,
  UtensilsCrossed,
  BarChart3,
  Users,
  QrCode,
  Settings,
  ShoppingBag,
  X,
  ChefHat,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      group: 'MAIN',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'POS Counter', href: '/admin/billing', icon: Calculator, badge: 'Live' },
        { label: 'Live Orders', href: '/admin/orders', icon: ShoppingBag },
      ],
    },
    {
      group: 'RESTAURANT',
      items: [
        { label: 'Menu & Addons', href: '/admin/menu', icon: UtensilsCrossed },
        { label: 'Sales Reports', href: '/admin/reports', icon: BarChart3 },
        { label: 'Staff Accounts', href: '/admin/staff', icon: Users },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'QR Standees', href: '/admin/tables', icon: QrCode },
        { label: 'Store Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#EFF0F6] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#EFF0F6]">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-lg shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 block leading-tight">
                Wrap Nation
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                FoodScan Admin
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 thin-scrolling">
          {menuItems.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                {group.group}
              </p>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-amber-400/20 text-neutral-950 font-bold border border-amber-300/80 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            active ? 'text-amber-600 stroke-[2.2]' : 'text-neutral-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#EFF0F6] bg-neutral-50/50">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Branch</span>
            <span className="font-semibold text-neutral-800">Main Outlet #1</span>
          </div>
        </div>
      </aside>
    </>
  );
}

