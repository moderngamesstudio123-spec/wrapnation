'use client';

import React, { useState, useEffect } from 'react';
import { formatPaise } from '@/lib/format';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  ShoppingBag,
  Utensils,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DailyReport {
  date: string;
  totalRevenuePaise: number;
  totalRevenueFormatted: string;
  totalOrdersCount: number;
  upiRevenuePaise: number;
  upiRevenueFormatted: string;
  cashRevenuePaise: number;
  cashRevenueFormatted: string;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  topSellingItems: Array<{
    itemName: string;
    quantity: number;
    revenuePaise: number;
    revenueFormatted: string;
  }>;
}

export default function AdminReportsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?date=${dateStr}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. Financial reports are restricted to OWNER role.');
        }
        throw new Error('Failed to load financial report');
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const handleDownloadCsv = () => {
    window.open(`/api/reports/export?date=${selectedDate}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Daily Sales & Reconciliation</span>
            <BarChart3 className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-xs text-neutral-400">
            Reconcile daily counter cash and PhonePe/GPay UPI statement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            />
          </div>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-3xl bg-neutral-900 border border-rose-900/60 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-bold text-white text-base">Restricted Access</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">{error}</p>
        </div>
      ) : loading || !report ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-neutral-500">Calculating financial metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Revenue Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2 shadow-lg">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                Total Revenue
              </span>
              <div className="text-3xl font-black text-amber-400">
                {report.totalRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">
                Across {report.totalOrdersCount} paid orders
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                  UPI Soundbox Revenue
                </span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.upiRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">
                Match with PhonePe/GPay merchant credits
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                  Cash Collected
                </span>
                <Banknote className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.cashRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">Physical drawer cash total</p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2 shadow-lg">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                Dine-in vs Takeaway
              </span>
              <div className="text-xl font-black text-white flex items-center gap-3 pt-1">
                <span className="flex items-center gap-1 text-sm text-neutral-300">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  {report.dineInOrdersCount} Dine-in
                </span>
                <span className="text-neutral-600">/</span>
                <span className="flex items-center gap-1 text-sm text-neutral-300">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  {report.takeawayOrdersCount} Takeaway
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">Fulfillment distribution</p>
            </div>
          </div>

          {/* Top Selling Items Leaderboard */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Best Selling Items</span>
              </h2>
              <span className="text-xs text-neutral-500">Ranked by volume sold</span>
            </div>

            {report.topSellingItems.length === 0 ? (
              <p className="text-neutral-500 text-xs py-4 text-center">
                No sales recorded for this date.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Item Name</th>
                      <th className="py-2.5 text-center">Quantity Sold</th>
                      <th className="py-2.5 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {report.topSellingItems.map((item, idx) => (
                      <tr key={item.itemName} className="hover:bg-neutral-850/50 transition">
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span>{item.itemName}</span>
                        </td>
                        <td className="py-3 text-center font-bold text-neutral-300">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right font-black text-amber-400">
                          {item.revenueFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
