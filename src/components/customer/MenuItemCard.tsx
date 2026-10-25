'use client';

import React, { useState } from 'react';
import VegBadge from './VegBadge';
import { formatPaise } from '@/lib/format';
import { useCart } from '@/lib/customer/cartContext';
import ItemCustomizationModal, { ModalMenuItem } from './ItemCustomizationModal';
import { Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: ModalMenuItem & { isAvailable: boolean };
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, updateQuantity, items, getItemQuantity } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartQuantity = getItemQuantity(item.id);
  const hasCustomizations = item.variants.length > 0 || item.addOnLinks.length > 0;

  // Find first cart item matching this menuItem to allow quick stepper manipulation
  const firstCartItem = items.find((i) => i.menuItemId === item.id);

  const handleAddClick = () => {
    if (!item.isAvailable) return;
    if (hasCustomizations) {
      setIsModalOpen(true);
    } else {
      addItem({
        id: item.id,
        name: item.name,
        basePrice: item.basePrice,
        isVeg: item.isVeg,
      });
    }
  };

  const handleIncrement = () => {
    if (hasCustomizations) {
      // If customized, opening modal allows customer to choose additional combos or repeat
      setIsModalOpen(true);
    } else if (firstCartItem) {
      updateQuantity(firstCartItem.key, 1);
    } else {
      handleAddClick();
    }
  };

  const handleDecrement = () => {
    if (firstCartItem) {
      updateQuantity(firstCartItem.key, -1);
    }
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
          item.isAvailable
            ? 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
            : 'bg-neutral-950/60 border-neutral-900 opacity-60'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <VegBadge isVeg={item.isVeg} />
              <h3 className="font-bold text-base text-white leading-snug">{item.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-base">
                {formatPaise(item.basePrice)}
              </span>
              {hasCustomizations && (
                <span className="text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                  Customizable
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
          <div>
            {!item.isAvailable && (
              <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                Out of Stock
              </span>
            )}
          </div>

          <div>
            {!item.isAvailable ? (
              <button
                disabled
                className="py-1.5 px-4 text-xs font-bold rounded-xl bg-neutral-800 text-neutral-500 cursor-not-allowed"
              >
                UNAVAILABLE
              </button>
            ) : cartQuantity === 0 ? (
              <button
                onClick={handleAddClick}
                className="min-h-[44px] min-w-[80px] py-2 px-5 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <div className="min-h-[44px] flex items-center rounded-xl bg-amber-400 text-neutral-950 font-black shadow-md overflow-hidden">
                <button
                  onClick={handleDecrement}
                  className="w-9 h-11 flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 transition cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="px-2 text-sm text-center min-w-[24px]">
                  {cartQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-9 h-11 flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 transition cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {hasCustomizations && (
        <ItemCustomizationModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={(variant, addOns) => {
            addItem(
              {
                id: item.id,
                name: item.name,
                basePrice: item.basePrice,
                isVeg: item.isVeg,
              },
              variant,
              addOns
            );
          }}
        />
      )}
    </>
  );
}
