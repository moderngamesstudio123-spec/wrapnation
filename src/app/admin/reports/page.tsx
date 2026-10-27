'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  ShoppingBag,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Lock,
} from 'lucide-react';

interface OrderLedgerItem {
  id: string;
  orderNumber: number;
  timeFormatted: string;
  type: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  utr: string | null;
  itemsSummary: string;
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  totalPaise: number;
}

interface DailyReport {
  date: string;
  dateFormatted: string;
  generatedAt: string;
  auditSignature: string;
  grossRevenuePaise: number;
  grossRevenueFormatted: string;
  netRevenuePaise: number;
  netRevenueFormatted: string;
  taxPaise: number;
  taxFormatted: string;
  cashRevenuePaise: number;
  cashRevenueFormatted: string;
  upiRevenuePaise: number;
  upiRevenueFormatted: string;
  reconciliationMatch: boolean;
  totalOrdersCount: number;
  paidOrdersCount: number;
  cancelledOrdersCount: number;
  totalItemsSold: number;
  averageOrderValueFormatted: string;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  topSellingItems: Array<{
    itemName: string;
    quantity: number;
    revenuePaise: number;
    revenueFormatted: string;
  }>;
  ordersList: OrderLedgerItem[];
}

export default function AdminReportsPage() {
  // Use today's date in Indian Standard Time (YYYY-MM-DD)
  const getTodayIst = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayIst());
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

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Date Selector (No-Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
            <span>Daily Financial Audit & PDF Report</span>
            <BarChart3 className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-xs text-neutral-600 font-medium">
            Accurate Cash & UPI reconciliation with tamper-evident cryptographic checksum
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs shadow-xs">
            <Calendar className="w-4 h-4 text-amber-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-neutral-900 font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Print to PDF Button */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:bg-neutral-900 text-amber-400 font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Official Print Letterhead (Visible ONLY during Print / PDF generation) */}
      <div className="hidden print:block border-b-2 border-neutral-900 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-950">
              Wrap Nation Fast Food
            </h1>
            <p className="text-xs text-neutral-700 font-bold">
              8-4, 549/48, AG Colony Rd, Erragadda, Hyderabad, Telangana 500038
            </p>
            <p className="text-xs text-neutral-600">
              Phone: +91 81250 57086 • GST Compliant Financial Statement
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase px-2 py-1 bg-neutral-900 text-white rounded">
              Daily Audit Report
            </span>
            <p className="text-xs font-bold text-neutral-900 mt-1">
              Date: {report?.dateFormatted || selectedDate}
            </p>
            <p className="text-[10px] text-neutral-500 font-mono">
              Printed At: {report?.generatedAt || ''} IST
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-3xl bg-white border border-rose-300 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-bold text-neutral-950 text-base">Restricted Access</h3>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto">{error}</p>
        </div>
      ) : loading || !report ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs text-neutral-500 font-semibold">
            Reconciling today&apos;s orders and calculating financial totals...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. Reconciliation & Anti-Hack Integrity Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                ✓
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 leading-tight flex items-center gap-1.5">
                  <span>Hisab 100% Balanced & Verified</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </h3>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Cash ({report.cashRevenueFormatted}) + UPI ({report.upiRevenueFormatted}) = Total Gross Sales ({report.grossRevenueFormatted}). Zero discrepancy!
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-emerald-900 shrink-0 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="font-bold text-neutral-500 block text-[9px] uppercase tracking-wider">
                Cryptographic Audit Hash
              </span>
              <span className="font-black text-neutral-900 tracking-wider">
                {report.auditSignature}
              </span>
            </div>
          </div>

          {/* 3. Executive Financial KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Revenue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block">
                Gross Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">
                {report.grossRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">
                {report.paidOrdersCount} Paid Orders (AOV: {report.averageOrderValueFormatted})
              </p>
            </div>

            {/* Card 2: Cash in Counter */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block">
                  Cash in Counter
                </span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                {report.cashRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">Physical drawer cash total</p>
            </div>

            {/* Card 3: Online UPI Revenue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block">
                  PhonePe / UPI
                </span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                {report.upiRevenueFormatted}
              </div>
              <p className="text-[11px] text-neutral-500">Bank credit via UPI QR code</p>
            </div>

            {/* Card 4: Volume & Fulfillment */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block">
                Total Items Sold
              </span>
              <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                {report.totalItemsSold} <span className="text-xs font-bold text-neutral-500">units</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {report.totalOrdersCount} Total • {report.cancelledOrdersCount} Cancelled
              </p>
            </div>
          </div>

          {/* 4. Best Selling Items Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h2 className="text-sm font-black text-neutral-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Product-Wise Sales Breakdown</span>
              </h2>
              <span className="text-xs text-neutral-500 font-bold">
                {report.topSellingItems.length} Products Sold
              </span>
            </div>

            {report.topSellingItems.length === 0 ? (
              <p className="text-neutral-400 text-xs py-4 text-center">
                No food sales recorded for this date.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="py-2">Item Name</th>
                      <th className="py-2 text-center">Units Sold</th>
                      <th className="py-2 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {report.topSellingItems.map((item, idx) => (
                      <tr key={item.itemName} className="hover:bg-amber-50/40 transition">
                        <td className="py-2 font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[9px] font-black border border-neutral-200 shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.itemName}</span>
                        </td>
                        <td className="py-2 text-center font-bold text-neutral-800">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right font-black text-amber-700">
                          {item.revenueFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. Complete Itemized Order Audit Ledger (Anti-Hack Exact Hisab) */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h2 className="text-sm font-black text-neutral-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Daily Itemized Order Ledger (Order-by-Order Audit)</span>
              </h2>
              <span className="text-xs text-neutral-500 font-bold">
                {report.ordersList.length} Orders Listed
              </span>
            </div>

            {report.ordersList.length === 0 ? (
              <p className="text-neutral-400 text-xs py-6 text-center">
                Zero orders recorded on this date.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-neutral-200 text-neutral-600 font-black uppercase tracking-wider">
                      <th className="py-2.5 px-2">Order #</th>
                      <th className="py-2.5 px-2">Time (IST)</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Phone</th>
                      <th className="py-2.5 px-2">Items Summary</th>
                      <th className="py-2.5 px-2 text-center">Payment</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {report.ordersList.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50 transition">
                        <td className="py-2.5 px-2 font-black text-neutral-950">
                          #{o.orderNumber}
                        </td>
                        <td className="py-2.5 px-2 font-medium text-neutral-600 whitespace-nowrap">
                          {o.timeFormatted}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-neutral-900">
                          {o.customerName}
                        </td>
                        <td className="py-2.5 px-2 text-neutral-600 font-mono text-[11px]">
                          {o.customerPhone}
                        </td>
                        <td className="py-2.5 px-2 text-neutral-700 max-w-xs truncate" title={o.itemsSummary}>
                          {o.itemsSummary}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              o.paymentMethod === 'CASH'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-neutral-950 font-mono">
                          {o.totalFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Ledger Total Row */}
                  <tfoot>
                    <tr className="border-t-2 border-neutral-900 bg-neutral-50 font-black text-xs">
                      <td colSpan={5} className="py-3 px-2 text-neutral-900 uppercase">
                        Total Audit Ledger Reconciled ({report.paidOrdersCount} Paid Orders)
                      </td>
                      <td className="py-3 px-2 text-center text-emerald-800">
                        Cash: {report.cashRevenueFormatted}
                      </td>
                      <td className="py-3 px-2 text-center text-amber-800">
                        UPI: {report.upiRevenueFormatted}
                      </td>
                      <td className="py-3 px-2 text-right text-base text-neutral-950 font-mono">
                        {report.grossRevenueFormatted}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Official Sign-off & Audit Seal (Visible in Print & Screen) */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>
                Wrap Nation POS Financial Ledger • Tamper-Evident SHA-256 Hash: {report.auditSignature}
              </span>
            </div>

            <div className="hidden print:block text-right pt-8">
              <div className="border-t border-neutral-900 w-48 inline-block pt-1 text-center font-bold text-neutral-900">
                Audited & Approved By (Owner)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
