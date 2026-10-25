'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  QrCode,
  Store,
  Printer,
} from 'lucide-react';

interface SettingsData {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  gstEnabled: boolean;
  gstin: string;
  gstPercentage: number;
  openingTime: string;
  closingTime: string;
  tablesCount: number;
  unpaidOrderTimeoutMins: number;
  upiId: string;
  payeeName: string;
  upiQrUrl: string;
  printerPaperWidth: '80' | '58';
  printerEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [upiMessage, setUpiMessage] = useState<string | null>(null);
  const [upiError, setUpiError] = useState<string | null>(null);

  // UPI settings state
  const [upiIdInput, setUpiIdInput] = useState('');
  const [payeeNameInput, setPayeeNameInput] = useState('');
  const [upiQrUrlInput, setUpiQrUrlInput] = useState('');
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setUpiIdInput(data.settings.upiId || '');
          setPayeeNameInput(data.settings.payeeName || '');
          setUpiQrUrlInput(data.settings.upiQrUrl || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSavingGeneral(true);
    setGeneralMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: settings.shopName,
          shopAddress: settings.shopAddress,
          shopPhone: settings.shopPhone,
          gstEnabled: settings.gstEnabled,
          gstin: settings.gstin || '',
          gstPercentage: settings.gstPercentage,
          openingTime: settings.openingTime,
          closingTime: settings.closingTime,
          tablesCount: settings.tablesCount,
          unpaidOrderTimeoutMins: settings.unpaidOrderTimeoutMins,
          printerPaperWidth: settings.printerPaperWidth,
          printerEnabled: settings.printerEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setGeneralMessage('General shop settings saved successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpi(true);
    setUpiMessage(null);
    setUpiError(null);

    try {
      const res = await fetch('/api/settings/upi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: upiIdInput.trim(),
          payeeName: payeeNameInput.trim(),
          qrImageUrl: upiQrUrlInput.trim() || null,
          currentPassword: ownerPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update UPI settings');

      setUpiMessage('Shop UPI settings verified and updated successfully.');
      setOwnerPasswordInput('');
    } catch (err: unknown) {
      setUpiError(err instanceof Error ? err.message : 'Failed to update UPI settings');
    } finally {
      setSavingUpi(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <p className="text-xs text-neutral-500">Loading shop settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
          <span>Shop & System Settings</span>
          <SettingsIcon className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-xs text-neutral-600 font-medium">
          Configure store identity, operating hours, GST, and secure payment credentials
        </p>
      </div>

      {/* 1. General Settings Form */}
      <form onSubmit={handleSaveGeneral} className="p-6 rounded-3xl bg-white border border-neutral-200/90 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" />
            <h2 className="font-black text-base text-neutral-950">General Shop Profile</h2>
          </div>
          {generalMessage && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {generalMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">Shop Name</label>
            <input
              type="text"
              required
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">Contact Phone Number</label>
            <input
              type="text"
              required
              value={settings.shopPhone}
              onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-neutral-700 font-bold block">Shop Address</label>
            <input
              type="text"
              required
              value={settings.shopAddress}
              onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          {/* Operating Hours */}
          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">Opening Time (24h)</label>
            <input
              type="text"
              placeholder="11:00"
              required
              value={settings.openingTime}
              onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">Closing Time (24h)</label>
            <input
              type="text"
              placeholder="23:00"
              required
              value={settings.closingTime}
              onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          {/* Tables count & Unpaid timeout */}
          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">Dine-in Tables Count</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={settings.tablesCount}
              onChange={(e) =>
                setSettings({ ...settings, tablesCount: parseInt(e.target.value, 10) || 12 })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-700 font-bold block">
              Unpaid Order Timeout (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              required
              value={settings.unpaidOrderTimeoutMins}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  unpaidOrderTimeoutMins: parseInt(e.target.value, 10) || 15,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          {/* GST Configuration */}
          <div className="sm:col-span-2 pt-2 border-t border-neutral-100 space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="gst-toggle"
                type="checkbox"
                checked={settings.gstEnabled}
                onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-amber-500 bg-white focus:ring-0 cursor-pointer"
              />
              <label htmlFor="gst-toggle" className="text-neutral-900 font-bold cursor-pointer">
                Enable GST Tax Calculation on Orders
              </label>
            </div>

            {settings.gstEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-neutral-700 font-bold block">Shop GSTIN</label>
                  <input
                    type="text"
                    placeholder="29AAAAA0000A1Z5"
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono focus:outline-none focus:border-amber-400 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-700 font-bold block">GST Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    step="0.5"
                    value={settings.gstPercentage}
                    onChange={(e) =>
                      setSettings({ ...settings, gstPercentage: parseFloat(e.target.value) || 5 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Thermal Printer Settings */}
          <div className="sm:col-span-2 pt-2 border-t border-neutral-100 space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold">
              <Printer className="w-4 h-4 text-amber-600" />
              <span>Thermal Receipt Slip Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-bold block">Receipt Paper Width</label>
                <select
                  value={settings.printerPaperWidth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      printerPaperWidth: e.target.value as '80' | '58',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 cursor-pointer shadow-xs"
                >
                  <option value="80">80mm (Standard POS Thermal)</option>
                  <option value="58">58mm (Compact Thermal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-bold block">Auto-Print to Agent</label>
                <select
                  value={settings.printerEnabled ? 'true' : 'false'}
                  onChange={(e) =>
                    setSettings({ ...settings, printerEnabled: e.target.value === 'true' })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 cursor-pointer shadow-xs"
                >
                  <option value="true">Enabled (Auto-dispatch print jobs)</option>
                  <option value="false">Disabled (Manual browser print only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingGeneral}
            className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile Settings</span>
          </button>
        </div>
      </form>

      {/* 2. Critical Security: Shop UPI Configuration Form */}
      <form onSubmit={handleSaveUpi} className="p-6 rounded-3xl bg-white border-2 border-amber-400 space-y-6 shadow-sm">
        <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <h2 className="font-black text-base text-neutral-950">
                Shop PhonePe / GPay UPI Configuration
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Only the shop OWNER can modify payment credentials. Requires password re-authentication.
            </p>
          </div>
        </div>

        {upiMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{upiMessage}</span>
          </div>
        )}

        {upiError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{upiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-800 font-bold block">
              Shop UPI ID (VPA) *
            </label>
            <input
              type="text"
              required
              placeholder="wrapnation@okaxis"
              value={upiIdInput}
              onChange={(e) => setUpiIdInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-amber-700 font-mono text-sm focus:outline-none focus:border-amber-400 font-bold shadow-xs"
            />
            <p className="text-[10px] text-neutral-500">
              Must match the VPA on your shop PhonePe/GPay soundbox.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-800 font-bold block">
              Registered Payee Name *
            </label>
            <input
              type="text"
              required
              placeholder="Wrap Nation Fast Food"
              value={payeeNameInput}
              onChange={(e) => setPayeeNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-neutral-800 font-bold block">
              Static QR Image URL (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty to auto-generate dynamic QR from VPA"
              value={upiQrUrlInput}
              onChange={(e) => setUpiQrUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-amber-400 font-mono shadow-xs"
            />
          </div>

          {/* Owner Current Password Verification */}
          <div className="sm:col-span-2 p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Owner Password Verification Required</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Re-enter your current password to authorize changes to the shop UPI ID or QR code.
            </p>
            <input
              type="password"
              required
              placeholder="Your current owner password"
              value={ownerPasswordInput}
              onChange={(e) => setOwnerPasswordInput(e.target.value)}
              className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingUpi || !ownerPasswordInput}
            className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            {savingUpi ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            <span>Authorize & Update UPI QR</span>
          </button>
        </div>
      </form>
    </div>
  );
}
