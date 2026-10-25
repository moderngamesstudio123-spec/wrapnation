'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user?.mustChangePassword) {
        router.replace('/change-password');
      } else {
        router.replace('/admin');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Wrap Nation POS</h1>
          <p className="text-xs text-neutral-400">
            Sign in with your staff or owner credentials
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="staff@wrapnation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold text-sm tracking-wide shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to POS</span>
            )}
          </button>
        </form>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-300">Default Demo Credentials:</p>
          <div className="font-mono text-neutral-400 space-y-0.5">
            <div>Owner: owner@wrapnation.com / Owner@123456</div>
            <div>Staff: staff@wrapnation.com / Staff@123456</div>
          </div>
          <p className="text-[10px] text-amber-400/80 pt-1">
            * Forced password change on first login
          </p>
        </div>
      </div>
    </div>
  );
}
