'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface TableQRData {
  tableNumber: number;
  signedToken: string;
  orderUrl: string;
  qrDataUrl: string;
}

export default function AdminTableQRsPage() {
  const [tables, setTables] = useState<TableQRData[]>([]);
  const [takeawayQr, setTakeawayQr] = useState<{ orderUrl: string; qrDataUrl: string } | null>(
    null
  );
  const [shopName, setShopName] = useState<string>('Wrap Nation');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      {/* Non-print Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Printable Table QR Stickers</span>
            <QrCode className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-xs text-neutral-400">
            A6-sized printable stickers for all dining tables with HMAC cryptographic tokens
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print All Stickers (A6)</span>
        </button>
      </div>

      <div className="no-print p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Security Note:</strong> Table stickers contain ONLY the HMAC-signed menu ordering URL (`/t/[token]`). They deliberately do NOT include payment QR codes to prevent physical sticker tampering and diversion fraud.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-neutral-500">Generating cryptographic table stickers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Table Stickers */}
          {tables.map((t) => (
            <div
              key={t.tableNumber}
              className="a6-sticker-sheet bg-white text-black p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between text-center border-2 border-neutral-200"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
                  {shopName}
                </span>
                <h2 className="text-3xl font-black tracking-tight text-neutral-950">
                  TABLE #{t.tableNumber}
                </h2>
                <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full"></div>
              </div>

              {/* QR Code */}
              <div className="my-4 p-2 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-inner">
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
  );
}
