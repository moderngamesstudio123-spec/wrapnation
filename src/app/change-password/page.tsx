'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      router.replace('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Set New Password</h1>
          <p className="text-xs text-neutral-400">
            For security, you must update your password before accessing the POS dashboard.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Current / Temporary Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              New Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold text-sm tracking-wide shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password & Enter POS</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
