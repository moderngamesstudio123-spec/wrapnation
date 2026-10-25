'use client';

import React, { useState } from 'react';
import { X, QrCode, Banknote, AlertTriangle, Loader2 } from 'lucide-react';
import { formatPaise } from '@/lib/format';

interface MarkPaidModalProps {
  order: {
    id: string;
    orderNumber: number;
    takeawayToken?: string | null;
    total: number;
    customerUtrHint?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkPaidModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: MarkPaidModalProps) {
  const [method, setMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [utr, setUtr] = useState(order.customerUtrHint || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          utr: utr.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark order as paid');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error confirming payment';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const orderTokenLabel = order.takeawayToken || `#${order.orderNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl space-y-5 text-neutral-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-neutral-950">Confirm Payment</h3>
            <p className="text-xs text-neutral-600">
              Order {orderTokenLabel} • Amount:{' '}
              <strong className="text-amber-600 font-black">{formatPaise(order.total)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer hint highlight if present */}
        {order.customerUtrHint && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-semibold">Customer reported UTR digits:</span>
            <span className="font-mono font-black text-sm bg-white border border-amber-300 px-2 py-0.5 rounded text-neutral-950">
              {order.customerUtrHint}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Payment Method Toggle */}
          <div className="space-y-1.5">
            <label className="text-neutral-700 font-bold block">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer shadow-xs ${
                  method === 'UPI'
                    ? 'border-amber-400 bg-amber-400 text-neutral-950 font-black'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI Soundbox</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer shadow-xs ${
                  method === 'CASH'
                    ? 'border-amber-400 bg-amber-400 text-neutral-950 font-black'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash at Counter</span>
              </button>
            </div>
          </div>

          {/* Optional UTR entry */}
          {method === 'UPI' && (
            <div className="space-y-1.5">
              <label className="text-neutral-700 font-bold block">
                Transaction Reference / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter full or last 4 digits of UTR"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono focus:outline-none focus:border-amber-400 text-xs shadow-xs"
              />
              <p className="text-[10px] text-neutral-500">
                System prevents duplicate UTR reuse across orders.
              </p>
            </div>
          )}

          {/* Internal Staff Notes */}
          <div className="space-y-1.5">
            <label className="text-neutral-700 font-bold block">Internal Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Verified by cashier Ravi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-400 text-xs shadow-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Printing...</span>
                </>
              ) : (
                <span>Confirm Paid & Print Bill</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
