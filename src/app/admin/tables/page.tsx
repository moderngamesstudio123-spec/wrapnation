'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Loader2, QrCode, ShieldCheck, CheckCircle2, Users, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ActiveOrderData {
  id: string;
  orderNumber: number;
  status: string;
  total?: number;
  createdAt: string;
}

interface TableQRData {
  tableNumber: number;
  signedToken: string;
  orderUrl: string;
  qrDataUrl: string;
  isOccupied?: boolean;
  activeOrder?: ActiveOrderData | null;
}

export default function AdminTableQRsPage() {
  const [tables, setTables] = useState<TableQRData[]>([]);
  const [takeawayQr, setTakeawayQr] = useState<{ orderUrl: string; qrDataUrl: string } | null>(
    null
  );
  const [shopName, setShopName] = useState<string>('Wrap Nation');
  const [loading, setLoading] = useState(true);
  const [vacatingTable, setVacatingTable] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTables = useCallback(() => {
    fetch('/api/tables/qr')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) setTables(data.tables);
        if (data.takeaway) setTakeawayQr(data.takeaway);
        if (data.shopName) setShopName(data.shopName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const handleVacateTable = async (tableNumber: number) => {
    setVacatingTable(tableNumber);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/tables/vacate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Table #${tableNumber} vacated successfully! It is now available for new guests.`);
        fetchTables();
      } else {
        alert(data.error || 'Failed to vacate table');
      }
    } catch {
      alert('Network error vacating table');
    } finally {
      setVacatingTable(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const availableCount = tables.length - occupiedCount;

  return (
    <div className="space-y-8">
      {/* Non-print Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
            <span>Dining Tables & QR Stickers</span>
            <QrCode className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-xs text-neutral-600 font-medium">
            Live table occupancy management, anti-fraud HMAC tokens, and A6 printable stickers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Stickers (A6)</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="no-print p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Live Table Occupancy Management Grid (No-Print) */}
      <div className="no-print space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-neutral-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Live Table Occupancy Status</span>
          </h2>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Available ({availableCount})</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Occupied ({occupiedCount})</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((t) => {
            const isOcc = !!t.isOccupied;
            return (
              <div
                key={t.tableNumber}
                className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                  isOcc
                    ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                    : 'bg-white border-neutral-200 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-neutral-900">
                      Table #{t.tableNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOcc ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    ></span>
                  </div>

                  <div className="mt-1">
                    {isOcc ? (
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider block">
                          Occupied
                        </span>
                        {t.activeOrder && (
                          <span className="text-[11px] font-bold text-neutral-700 block">
                            Order #{t.activeOrder.orderNumber}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Available
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  {isOcc ? (
                    <button
                      onClick={() => handleVacateTable(t.tableNumber)}
                      disabled={vacatingTable === t.tableNumber}
                      className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 font-black text-[11px] shadow-2xs transition cursor-pointer"
                    >
                      {vacatingTable === t.tableNumber ? 'Vacating...' : 'Vacate Table'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-semibold block text-center">
                      Ready for guests
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Note Banner */}
      <div className="no-print p-4 rounded-2xl bg-white border border-amber-200 text-xs text-neutral-700 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Security Note:</strong> Table stickers contain ONLY HMAC-signed menu ordering URLs (`/t/[token]`). They deliberately do NOT include payment QR codes to prevent physical sticker tampering and diversion fraud.
        </p>
      </div>

      {/* 2. Printable Table QR Stickers Grid */}
      <div className="space-y-3">
        <div className="no-print border-t border-neutral-200 pt-6 flex items-center justify-between">
          <h2 className="text-base font-black text-neutral-900">
            Printable A6 Table Stickers
          </h2>
          <span className="text-xs text-neutral-500 font-medium">
            Click &apos;Print All Stickers&apos; above or print directly
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-neutral-500">Generating cryptographic table stickers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Table Stickers */}
            {tables.map((t) => (
              <div
                key={t.tableNumber}
                className="a6-sticker-sheet bg-white text-neutral-950 p-6 rounded-3xl shadow-md flex flex-col items-center justify-between text-center border-2 border-amber-300"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-700">
                    {shopName}
                  </span>
                  <h2 className="text-3xl font-black tracking-tight text-neutral-950">
                    TABLE #{t.tableNumber}
                  </h2>
                  <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full"></div>
                </div>

                {/* QR Code */}
                <div className="my-4 p-2 bg-amber-50/50 rounded-2xl border border-amber-200 shadow-inner">
                  {t.qrDataUrl && (
                    <Image
                      src={t.qrDataUrl}
                      alt={`Table ${t.tableNumber} QR Code`}
                      width={200}
                      height={200}
                      className="w-48 h-48 object-contain"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-neutral-900 leading-snug">
                    Scan with Phone Camera to Order
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    No app download needed • Secure Table QR
                  </p>
                </div>
              </div>
            ))}

            {/* Takeaway Counter Sticker */}
            {takeawayQr && (
              <div className="a6-sticker-sheet bg-neutral-950 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between text-center border-2 border-amber-400">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                    {shopName}
                  </span>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                    TAKEAWAY ORDER
                  </h2>
                  <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full"></div>
                </div>

                <div className="my-4 p-3 bg-white rounded-2xl shadow-inner">
                  {takeawayQr.qrDataUrl && (
                    <Image
                      src={takeawayQr.qrDataUrl}
                      alt="Takeaway Counter QR"
                      width={200}
                      height={200}
                      className="w-48 h-48 object-contain"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-amber-400 leading-snug">
                    Scan with Phone Camera for Takeaway
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Order on your phone • Collect at counter
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
