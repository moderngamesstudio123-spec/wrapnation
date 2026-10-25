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
          <h1 className="text-2xl font-black text-white tracking-tight">Menu Management</h1>
          <p className="text-xs text-neutral-400">
            Control live item availability (Out of Stock toggles) & adjust prices
          </p>
        </div>

        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
          💡 Price updates apply to future orders only. Historical orders preserve their original rates.
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-neutral-500">Loading menu items...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="space-y-3">
              <h2 className="text-base font-black text-amber-400 uppercase tracking-wider border-b border-neutral-800 pb-2">
                {category.name} ({category.items.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      item.isAvailable
                        ? 'bg-neutral-900 border-neutral-800'
                        : 'bg-neutral-950 border-neutral-850 opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <VegBadge isVeg={item.isVeg} />
                          <h3 className="font-bold text-sm text-white">{item.name}</h3>
                        </div>

                        {/* Stock Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.isAvailable
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">
                          {formatPaise(item.basePrice)}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-neutral-400 hover:text-amber-400 transition"
                          title="Edit Price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variants.length > 0 && (
                        <div className="text-[11px] text-neutral-400 space-y-0.5 pt-1">
                          {item.variants.map((v) => (
                            <div key={v.id}>
                              • {v.name}: +{formatPaise(v.priceDelta)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock Toggle Button */}
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">Availability</span>
                      <button
                        onClick={() => handleToggleStock(item.id, item.isAvailable)}
                        disabled={togglingId === item.id}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400 hover:bg-emerald-900'
                            : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-750'
                        }`}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : item.isAvailable ? (
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-lg text-white">Edit Base Price</h3>
                <p className="text-xs text-neutral-400">{editingItem.name}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold block">Base Price in INR (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-bold text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold"
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
