'use client';

import React, { useState, useEffect } from 'react';
import VegBadge from '@/components/customer/VegBadge';
import { formatPaise } from '@/lib/format';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isVeg: boolean;
  isAvailable: boolean;
  variants: Array<{ id: string; name: string; priceDelta: number }>;
  addOnLinks: Array<{ addOn: { id: string; name: string; price: number } }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit price modal state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newPriceRupees, setNewPriceRupees] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleStock = async (itemId: string, currentStatus: boolean) => {
    setTogglingId(itemId);
    try {
      const res = await fetch('/api/menu/toggle-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isAvailable: !currentStatus }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((item) =>
              item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
            ),
          }))
        );
      }
    } catch {}
    setTogglingId(null);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewPriceRupees(String(item.basePrice / 100));
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSavingPrice(true);
    try {
      const rupees = parseFloat(newPriceRupees);
      if (isNaN(rupees) || rupees < 0) return;

      const res = await fetch(`/api/menu/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: categories.find((c) => c.items.some((i) => i.id === editingItem.id))?.id,
          name: editingItem.name,
          basePriceRupees: rupees,
          isVeg: editingItem.isVeg,
          isAvailable: editingItem.isAvailable,
        }),
      });

      if (res.ok) {
        await fetchMenu();
        setEditingItem(null);
      }
    } catch {}
    setSavingPrice(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-950 tracking-tight">Menu Management</h1>
          <p className="text-xs text-neutral-600 font-medium">
            Control live item availability (Out of Stock toggles) & adjust prices
          </p>
        </div>

        <div className="text-xs text-neutral-700 bg-white border border-amber-200 p-2.5 rounded-xl shadow-xs">
          💡 Price updates apply to future orders only. Historical orders preserve their original rates.
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs text-neutral-500">Loading menu items...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="space-y-3">
              <h2 className="text-base font-black text-amber-800 uppercase tracking-wider border-b border-amber-200/80 pb-2">
                {category.name} ({category.items.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 shadow-xs ${
                      item.isAvailable
                        ? 'bg-white border-neutral-200/90 hover:border-amber-400'
                        : 'bg-neutral-50 border-neutral-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <VegBadge isVeg={item.isVeg} />
                          <h3 className="font-bold text-sm text-neutral-900">{item.name}</h3>
                        </div>

                        {/* Stock Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-neutral-950">
                          {formatPaise(item.basePrice)}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-neutral-400 hover:text-amber-700 transition"
                          title="Edit Price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variants.length > 0 && (
                        <div className="text-[11px] text-neutral-600 space-y-0.5 pt-1">
                          {item.variants.map((v) => (
                            <div key={v.id}>
                              • {v.name}: +{formatPaise(v.priceDelta)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock Toggle Button */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs text-neutral-500 font-medium">Availability</span>
                      <button
                        onClick={() => handleToggleStock(item.id, item.isAvailable)}
                        disabled={togglingId === item.id}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                          item.isAvailable
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : item.isAvailable ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-neutral-400" />
                        )}
                        <span>{item.isAvailable ? 'In Stock' : 'Mark Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-lg text-neutral-950">Edit Base Price</h3>
                <p className="text-xs text-neutral-500">{editingItem.name}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-800 font-bold block">Base Price in INR (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-950 font-bold text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black shadow-xs transition"
                >
                  {savingPrice ? 'Saving...' : 'Save Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
