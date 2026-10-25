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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30">
            <Utensils className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Select Your Table</h2>
          <p className="text-xs text-neutral-400">
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
                  ? 'bg-amber-400 text-neutral-950 border-amber-400 font-black shadow-lg'
                  : 'bg-neutral-950/80 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-white'
              }`}
            >
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 uppercase font-bold tracking-wider">
                Table
              </span>
              <span className="text-xl font-black">{t.tableNumber}</span>
            </button>
          ))}
        </div>

        {/* Scanner notice */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-850 flex items-center gap-3 text-left">
          <QrCode className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="text-white font-bold">Have a Table QR Sticker?</p>
            <p className="text-[11px] text-neutral-400">
              Scan the physical sticker on your table with your phone camera anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
