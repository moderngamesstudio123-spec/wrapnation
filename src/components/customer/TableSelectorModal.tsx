'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, QrCode, Utensils, ArrowRight } from 'lucide-react';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Array<{
    tableNumber: number;
    signedToken: string;
  }>;
}

export default function TableSelectorModal({
  isOpen,
  onClose,
  tables,
}: TableSelectorModalProps) {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSelectTable = (tableNumber: number, token: string) => {
    setSelectedTable(tableNumber);
    router.push(`/t/${token}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-2xl relative text-neutral-900"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-900 rounded-full bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
            <Utensils className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">Select Your Table</h2>
          <p className="text-xs text-neutral-500">
            Sitting at Wrap Nation? Tap your table number to start dine-in ordering:
          </p>
        </div>

        {/* Table Number Grid */}
        <div className="grid grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
          {tables.map((t) => (
            <button
              key={t.tableNumber}
              onClick={() => handleSelectTable(t.tableNumber, t.signedToken)}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group active:scale-95 ${
                selectedTable === t.tableNumber
                  ? 'bg-amber-400 text-neutral-950 border-amber-400 font-black shadow-md'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}
            >
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                Table
              </span>
              <span className="text-xl font-black">{t.tableNumber}</span>
            </button>
          ))}
        </div>

        {/* Scanner notice */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3 text-left">
          <QrCode className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-xs">
            <p className="text-neutral-900 font-bold">Have a Table QR Sticker?</p>
            <p className="text-[11px] text-neutral-500">
              Scan the physical sticker on your table with your phone camera anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
