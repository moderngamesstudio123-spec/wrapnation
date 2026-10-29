'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  ArrowUpRight,
  Calculator,
  Eye,
  CreditCard,
  Banknote,
  Clock,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';

interface OverviewData {
  totalSalesFormatted: string;
  totalSalesPaise: number;
  totalOrdersCount: number;
  todaySalesFormatted: string;
  todaySalesPaise: number;
  todayOrdersCount: number;
  todayPaidCount: number;
  totalCustomersCount: number;
  totalMenuItemsCount: number;
  cashRevenueFormatted: string;
  upiRevenueFormatted: string;
}

interface PopularItem {
  name: string;
  quantity: number;
  revenueFormatted: string;
}

interface RecentOrder {
  id: string;
  orderNumber: number;
  type: 'DINE_IN' | 'TAKEAWAY';
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName?: string | null;
  customerPhone?: string | null;
  totalFormatted: string;
  createdAt: string;
  itemsSummary: string;
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setPopularItems(data.popularItems || []);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000); // 20s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading FoodScan dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* FoodScan Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {getGreeting()}, <span className="text-amber-600">Admin</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            Wrap Nation Performance Overview & Live Statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/billing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-extrabold shadow-sm transition"
          >
            <Calculator className="w-4 h-4 stroke-[2.5]" />
            <span>POS Billing</span>
          </Link>
        </div>
      </div>

      {/* 4 FoodScan Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales Card (FoodScan Pink / Rose) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#FF4F99] to-[#E63980] text-white shadow-md shadow-pink-500/10 transition hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {overview?.totalSalesFormatted || '₹0'}
            </h3>
            <p className="text-[11px] font-medium text-white/80 mt-1 flex items-center gap-1.5">
              <span>Today:</span>
              <strong className="text-white font-bold">{overview?.todaySalesFormatted || '₹0'}</strong>
            </p>
          </div>
        </div>

        {/* Total Orders Card (FoodScan Portage / Indigo) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#8262FE] to-[#633DF8] text-white shadow-md shadow-indigo-500/10 transition hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {overview?.totalOrdersCount ?? 0}
            </h3>
            <p className="text-[11px] font-medium text-white/80 mt-1 flex items-center gap-1.5">
              <span>Today:</span>
              <strong className="text-white font-bold">{overview?.todayOrdersCount ?? 0} orders</strong>
            </p>
          </div>
        </div>

        {/* Total Customers Card (FoodScan Cornflower Blue) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#567DFF] to-[#3460FC] text-white shadow-md shadow-blue-500/10 transition hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Total Customers
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {overview?.totalCustomersCount ?? 0}
            </h3>
            <p className="text-[11px] font-medium text-white/80 mt-1">
              Registered & walk-in customer base
            </p>
          </div>
        </div>

        {/* Total Menu Items Card (FoodScan Heliotrope / Purple) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#A953FF] to-[#8E2BE2] text-white shadow-md shadow-purple-500/10 transition hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Menu Items
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {overview?.totalMenuItemsCount ?? 0}
            </h3>
            <p className="text-[11px] font-medium text-white/80 mt-1">
              Active items in catalog
            </p>
          </div>
        </div>
      </div>

      {/* Payment Split & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Payment Settlement */}
        <div className="p-6 rounded-2xl bg-white border border-[#EFF0F6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900">Today's Settlements</h3>
            <span className="text-[11px] font-semibold text-neutral-400">Cash vs UPI</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Cash Register</p>
                  <p className="text-[10px] text-emerald-700">Handled at counter</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-900">
                {overview?.cashRevenueFormatted || '₹0'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-950">Digital UPI QR</p>
                  <p className="text-[10px] text-blue-700">Instant scan & pay</p>
                </div>
              </div>
              <span className="text-sm font-black text-blue-900">
                {overview?.upiRevenueFormatted || '₹0'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/reports"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 border border-neutral-200 transition"
            >
              <span>View Full Reconciliation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Most Popular Items (Top 5) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#EFF0F6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Top Selling Wraps & Dishes</h3>
              <p className="text-[11px] text-neutral-400">Items ordered most frequently</p>
            </div>
            <Link
              href="/admin/menu"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Menu Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {popularItems.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center">
              No orders recorded yet today. Top sellers will display here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {popularItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/70 border border-neutral-100 hover:bg-neutral-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        index === 0
                          ? 'bg-amber-400 text-neutral-950'
                          : index === 1
                          ? 'bg-neutral-300 text-neutral-800'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="text-xs font-semibold text-neutral-500">
                      {item.quantity} sold
                    </span>
                    <span className="text-xs font-black text-neutral-900 min-w-[70px]">
                      {item.revenueFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent 10 Orders Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#EFF0F6] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Recent Customer Orders</h3>
            <p className="text-[11px] text-neutral-400">Real-time order feed</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Open Orders Board</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-neutral-400 py-10 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order Token</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-neutral-900 text-xs">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-neutral-800">
                        {order.customerName || 'Guest'}
                      </p>
                      <p className="text-[10px] text-neutral-400">{order.customerPhone || '—'}</p>
                    </td>
                    <td className="py-3 px-3 text-neutral-600 max-w-xs truncate">
                      {order.itemsSummary || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700">
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          order.status === 'READY'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : order.status === 'PREPARING'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-neutral-900">
                      {order.totalFormatted}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
