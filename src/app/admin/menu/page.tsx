'use client';

import React, { useState, useEffect } from 'react';
import VegBadge from '@/components/customer/VegBadge';
import { formatPaise } from '@/lib/format';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Variant {
  id?: string;
  name: string;
  priceDeltaRupees: number;
  isDefault?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  categoryId: string;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Add / Edit Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Item form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVariants, setFormVariants] = useState<Array<{ name: string; priceDeltaRupees: number }>>([]);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      setErrorMessage('Failed to load menu items');
    } finally {
      setLoading(false);
    }
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

  const openAddItemModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(categories[0]?.id || '');
    setFormBasePrice('');
    setFormDescription('');
    setFormIsVeg(false);
    setFormImageUrl('');
    setFormVariants([]);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: MenuItem, catId: string) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(catId);
    setFormBasePrice(String(item.basePrice / 100));
    setFormDescription(item.description || '');
    setFormIsVeg(item.isVeg);
    setFormImageUrl(item.imageUrl || '');
    setFormVariants(
      item.variants.map((v) => ({
        name: v.name,
        priceDeltaRupees: v.priceDelta / 100,
      }))
    );
    setShowItemModal(true);
  };

  const handleAddVariantRow = () => {
    setFormVariants((prev) => [...prev, { name: '', priceDeltaRupees: 0 }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: 'name' | 'priceDeltaRupees',
    value: string | number
  ) => {
    setFormVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const priceRupees = parseFloat(formBasePrice);
    if (isNaN(priceRupees) || priceRupees < 0) {
      setErrorMessage('Please enter a valid base price');
      setSavingItem(false);
      return;
    }

    try {
      const payload = {
        categoryId: formCategory,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        basePriceRupees: priceRupees,
        isVeg: formIsVeg,
        isAvailable: editingItem ? editingItem.isAvailable : true,
        imageUrl: formImageUrl.trim() || undefined,
        variants: formVariants
          .filter((v) => v.name.trim().length > 0)
          .map((v) => ({
            name: v.name.trim(),
            priceDeltaRupees: Number(v.priceDeltaRupees) || 0,
            isDefault: false,
          })),
      };

      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save item');

      setSuccessMessage(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
      setShowItemModal(false);
      fetchMenu();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error saving item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Delete ${name} from menu? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage(`${name} has been removed.`);
        fetchMenu();
      }
    } catch {
      setErrorMessage('Failed to delete item');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim(), sortOrder: categories.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      setSuccessMessage('Category created!');
      setShowCategoryModal(false);
      setCategoryName('');
      fetchMenu();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingCategory(false);
    }
  };

  const allItemsList = categories.flatMap((c) =>
    c.items.map((i) => ({ ...i, categoryName: c.name, catId: c.id }))
  );

  const filteredItems = allItemsList.filter((item) => {
    if (selectedCategoryId !== 'all' && item.catId !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-500" />
            <span>FoodScan Menu Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            Module 4: Manage Categories, Dishes, Variations (Sizes) & Availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition shadow-xs"
          >
            <Layers className="w-4 h-4 text-neutral-500" />
            <span>Add Category</span>
          </button>

          <button
            onClick={openAddItemModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-extrabold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4 text-rose-700" />
          </button>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scrolling">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategoryId === 'all'
                ? 'bg-neutral-900 text-amber-400'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All Items ({allItemsList.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategoryId === c.id
                  ? 'bg-neutral-900 text-amber-400'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {c.name} ({c.items.length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#EFF0F6] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">
            {selectedCategoryId === 'all'
              ? 'All Menu Items'
              : categories.find((c) => c.id === selectedCategoryId)?.name}
          </h3>
          <span className="text-xs font-semibold text-neutral-400">
            {filteredItems.length} dishes
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-xs text-neutral-400 py-12 text-center">No menu items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Base Price</th>
                  <th className="py-2.5 px-3">Variations / Sizes</th>
                  <th className="py-2.5 px-3">In Stock Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <VegBadge isVeg={item.isVeg} />
                        <div>
                          <p className="font-bold text-neutral-900 text-xs">{item.name}</p>
                          {item.description && (
                            <p className="text-[10px] text-neutral-400 max-w-xs truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700">
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-neutral-900">
                      {formatPaise(item.basePrice)}
                    </td>
                    <td className="py-3 px-3">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.variants.map((v) => (
                            <span
                              key={v.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {v.name} (+₹{v.priceDelta / 100})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Regular only</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStock(item.id, item.isAvailable)}
                        disabled={togglingId === item.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        )}
                        <span>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditItemModal(item, item.catId)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto thin-scrolling animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Chicken Shawarma Wrap"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">Base Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 150"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Food Type</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={!formIsVeg}
                      onChange={() => setFormIsVeg(false)}
                      className="accent-rose-500"
                    />
                    <span className="font-bold text-rose-700">🔴 Non-Veg</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={formIsVeg}
                      onChange={() => setFormIsVeg(true)}
                      className="accent-emerald-500"
                    />
                    <span className="font-bold text-emerald-700">🟢 Veg</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients or taste profile..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Variations / Sizes (Module 4) */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs">Variations & Sizes</h4>
                    <p className="text-[10px] text-neutral-500">
                      Add custom sizes or combos with extra price
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-[11px] transition shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Size</span>
                  </button>
                </div>

                {formVariants.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">No extra sizes added.</p>
                ) : (
                  <div className="space-y-2">
                    {formVariants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Combo / Large"
                          value={v.name}
                          onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-900"
                        />
                        <div className="flex items-center gap-1 w-28">
                          <span className="text-[11px] text-neutral-500">+₹</span>
                          <input
                            type="number"
                            placeholder="60"
                            value={v.priceDeltaRupees}
                            onChange={(e) =>
                              handleVariantChange(idx, 'priceDeltaRupees', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-900 font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-extrabold shadow-xs transition"
                >
                  {savingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900">Add Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burgers, Beverages, Desserts"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-extrabold shadow-xs transition"
                >
                  {savingCategory && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
