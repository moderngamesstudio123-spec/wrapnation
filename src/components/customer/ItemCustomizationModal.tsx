'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import VegBadge from './VegBadge';
import { formatPaise } from '@/lib/format';
import { CartAddOn } from '@/lib/customer/cartContext';

export interface ModalMenuItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isVeg: boolean;
  imageUrl?: string | null;
  variants: Array<{
    id: string;
    name: string;
    priceDelta: number;
  }>;
  addOnLinks: Array<{
    addOn: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

interface ItemCustomizationModalProps {
  item: ModalMenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    variant: { id: string; name: string; priceDelta: number } | null,
    addOns: CartAddOn[]
  ) => void;
}

export default function ItemCustomizationModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemCustomizationModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const selectedVariant = item.variants.find((v) => v.id === selectedVariantId) || null;
  const variantDelta = selectedVariant ? selectedVariant.priceDelta : 0;

  const selectedAddOns: CartAddOn[] = item.addOnLinks
    .filter((link) => selectedAddOnIds.has(link.addOn.id))
    .map((link) => ({
      id: link.addOn.id,
      name: link.addOn.name,
      price: link.addOn.price,
    }));

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const currentTotal = item.basePrice + variantDelta + addOnsTotal;

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onAddToCart(selectedVariant, selectedAddOns);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Optional Food Hero Image */}
        {item.imageUrl ? (
          <div className="relative w-full h-44 sm:h-48 bg-neutral-950 overflow-hidden shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/30" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-white bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-md transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <VegBadge isVeg={item.isVeg} />
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">{item.name}</h3>
              <p className="text-amber-400 font-semibold text-sm">
                Base price: {formatPaise(item.basePrice)}
              </p>
            </div>
          </div>
          {!item.imageUrl && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-sm">
          {item.description && (
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Variants section (e.g. Make it a combo) */}
          {item.variants.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-xs">
                Make it a Combo / Variant
              </h4>
              <div className="space-y-2">
                {/* Regular item option */}
                <label
                  onClick={() => setSelectedVariantId(null)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedVariantId === null
                      ? 'border-amber-400 bg-amber-400/10 text-white font-medium'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedVariantId === null
                          ? 'border-amber-400 bg-amber-400 text-black'
                          : 'border-neutral-600'
                      }`}
                    >
                      {selectedVariantId === null && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>Regular (Item Only)</span>
                  </div>
                  <span className="text-neutral-400">Included</span>
                </label>

                {/* Additional combo variants */}
                {item.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <label
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white font-medium'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400 text-black'
                              : 'border-neutral-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{v.name}</span>
                      </div>
                      <span className="text-amber-400 font-medium">
                        +{formatPaise(v.priceDelta)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Section */}
          {item.addOnLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-xs">
                Add-ons & Extras
              </h4>
              <div className="space-y-2">
                {item.addOnLinks.map((link) => {
                  const addOn = link.addOn;
                  const isChecked = selectedAddOnIds.has(addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'border-amber-400 bg-amber-400 text-black'
                              : 'border-neutral-600 bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span>{addOn.name}</span>
                      </div>
                      <span className="text-amber-400 font-medium">
                        +{formatPaise(addOn.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Calculated Total & Add Button */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-400 block">Total Item Price</span>
            <span className="text-xl font-bold text-white tracking-tight">
              {formatPaise(currentTotal)}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 max-w-xs py-3 px-6 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Add to Cart • {formatPaise(currentTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
