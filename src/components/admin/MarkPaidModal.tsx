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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Confirm Payment</h3>
            <p className="text-xs text-neutral-400">
              Order {orderTokenLabel} • Amount:{' '}
              <strong className="text-amber-400">{formatPaise(order.total)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer hint highlight if present */}
        {order.customerUtrHint && (
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs flex items-center justify-between">
            <span>Customer reported UTR digits:</span>
            <span className="font-mono font-bold text-sm bg-neutral-900 px-2 py-0.5 rounded">
              {order.customerUtrHint}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Payment Method Toggle */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-bold block">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                  method === 'UPI'
                    ? 'border-amber-400 bg-amber-400 text-neutral-950 shadow-md'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI Soundbox</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                  method === 'CASH'
                    ? 'border-amber-400 bg-amber-400 text-neutral-950 shadow-md'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
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
              <label className="text-neutral-400 font-bold block">
                Transaction Reference / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter full or last 4 digits of UTR"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
              />
              <p className="text-[10px] text-neutral-500">
                System prevents duplicate UTR reuse across orders.
              </p>
            </div>
          )}

          {/* Internal Staff Notes */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-bold block">Internal Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Verified by cashier Ravi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Printing...</span>
                </>
              ) : (
                <span>Confirm Paid & Print Slip</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
