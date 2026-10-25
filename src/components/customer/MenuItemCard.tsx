'use client';

import React, { useState } from 'react';
import VegBadge from './VegBadge';
import { formatPaise } from '@/lib/format';
import { useCart } from '@/lib/customer/cartContext';
import ItemCustomizationModal, { ModalMenuItem } from './ItemCustomizationModal';
import { Plus, Minus, Star } from 'lucide-react';

interface MenuItemCardProps {
  item: ModalMenuItem & { isAvailable: boolean };
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, updateQuantity, items, getItemQuantity } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartQuantity = getItemQuantity(item.id);
  const hasCustomizations = item.variants.length > 0 || item.addOnLinks.length > 0;
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
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative flex items-start justify-between gap-4 ${
          item.isAvailable
            ? 'bg-white border-neutral-200/80 hover:border-neutral-300 shadow-sm hover:shadow-md'
            : 'bg-neutral-100/70 border-neutral-200 opacity-60'
        }`}
      >
        {/* Left Column: Details */}
        <div className="flex-1 min-w-0 pr-1 space-y-2">
          {/* Veg Badge & Rating */}
          <div className="flex items-center gap-2">
            <VegBadge isVeg={item.isVeg} />
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>4.8</span>
            </span>
            {hasCustomizations && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-bold border border-neutral-200">
                Customizable
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 leading-snug">
            {item.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-900 font-extrabold text-base sm:text-lg">
              {formatPaise(item.basePrice)}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed pt-0.5 font-normal">
              {item.description}
            </p>
          )}
        </div>

        {/* Right Column: Swiggy-Style Food Image & ADD Button */}
        <div className="relative shrink-0 flex flex-col items-center">
          {/* Image Box */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden relative border border-neutral-200/90 bg-neutral-100 shadow-sm">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  item.isAvailable ? 'hover:scale-105' : 'grayscale'
                }`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs font-bold">
                Wrap Nation
              </div>
            )}

            {!item.isAvailable && (
              <div className="absolute inset-0 bg-neutral-900/70 flex items-center justify-center p-1 text-center">
                <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Swiggy Signature Floating ADD / Stepper Button */}
          <div className="relative -mt-4.5 z-10">
            {!item.isAvailable ? (
              <button
                disabled
                className="py-1.5 px-4 text-[11px] font-bold rounded-xl bg-neutral-200 text-neutral-500 cursor-not-allowed uppercase"
              >
                Sold Out
              </button>
            ) : cartQuantity === 0 ? (
              <button
                onClick={handleAddClick}
                className="min-h-[38px] min-w-[96px] py-1.5 px-5 text-xs font-black rounded-xl bg-white hover:bg-neutral-50 active:bg-neutral-100 text-emerald-600 uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 border border-neutral-200 active:scale-95"
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
              </button>
            ) : (
              <div className="min-h-[38px] min-w-[96px] flex items-center justify-between rounded-xl bg-amber-400 text-neutral-950 font-black shadow-md overflow-hidden border border-amber-500">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-9 flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 transition cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="px-2 text-sm text-center font-black">
                  {cartQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-9 flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 transition cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )}

            {/* Customizable hint text below button */}
            {hasCustomizations && item.isAvailable && (
              <span className="text-[10px] text-neutral-500 font-semibold block text-center mt-1">
                customisable
              </span>
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
