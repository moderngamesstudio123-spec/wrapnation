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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-neutral-200 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Optional Food Hero Image */}
        {item.imageUrl ? (
          <div className="relative w-full h-44 sm:h-48 bg-neutral-100 overflow-hidden shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-black/30" />
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
        <div className="p-4 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <VegBadge isVeg={item.isVeg} />
            <div>
              <h3 className="font-bold text-lg text-neutral-900 leading-tight">{item.name}</h3>
              <p className="text-amber-700 font-semibold text-sm">
                Base price: {formatPaise(item.basePrice)}
              </p>
            </div>
          </div>
          {!item.imageUrl && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-full bg-neutral-100 hover:bg-neutral-200 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-sm bg-white">
          {item.description && (
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Variants section (e.g. Make it a combo) */}
          {item.variants.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-xs">
                Make it a Combo / Variant
              </h4>
              <div className="space-y-2">
                {/* Regular item option */}
                <label
                  onClick={() => setSelectedVariantId(null)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedVariantId === null
                      ? 'border-amber-400 bg-amber-50 text-neutral-900 font-semibold shadow-xs'
                      : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedVariantId === null
                          ? 'border-amber-500 bg-amber-400 text-neutral-950 font-bold'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {selectedVariantId === null && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>Regular (Item Only)</span>
                  </div>
                  <span className="text-neutral-500 text-xs">Included</span>
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
                          ? 'border-amber-400 bg-amber-50 text-neutral-900 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-500 bg-amber-400 text-neutral-950 font-bold'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{v.name}</span>
                      </div>
                      <span className="text-amber-700 font-bold text-xs">
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
              <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-xs">
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
                          ? 'border-amber-400 bg-amber-50 text-neutral-900 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'border-amber-500 bg-amber-400 text-neutral-950 font-bold'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span>{addOn.name}</span>
                      </div>
                      <span className="text-amber-700 font-bold text-xs">
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
        <div className="p-4 border-t border-neutral-200 bg-white flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-500 block">Total Item Price</span>
            <span className="text-xl font-black text-neutral-900 tracking-tight">
              {formatPaise(currentTotal)}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 max-w-xs py-3 px-6 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Add to Cart • {formatPaise(currentTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
