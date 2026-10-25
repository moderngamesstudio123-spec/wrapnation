'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '@/lib/customer/cartContext';
import MenuItemCard from '@/components/customer/MenuItemCard';
import BottomCartBar from '@/components/customer/BottomCartBar';
import { Search, Utensils, ShoppingBag, X } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  items: Array<{
    id: string;
    name: string;
    description?: string | null;
    basePrice: number;
    isVeg: boolean;
    isAvailable: boolean;
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
  }>;
}

interface MenuViewProps {
  initialCategories: CategoryData[];
  shopName: string;
  shopPhone: string;
  shopAddress: string;
}

export default function MenuView({
  initialCategories,
  shopName,
  shopPhone,
}: MenuViewProps) {
  const { isDineIn, tableNumber } = useCart();
  const [categories] = useState<CategoryData[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    categories[0]?.slug || ''
  );

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToCategory = (slug: string) => {
    setActiveCategorySlug(slug);
    const element = sectionRefs.current[slug];
    if (element) {
      const yOffset = -140; // account for sticky header & tabs
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Scroll-spy observer
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (const cat of categories) {
        const el = sectionRefs.current[cat.slug];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveCategorySlug(cat.slug);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Filter items by search query and veg-only flag
  const filteredCategories = categories
    .map((cat) => {
      const filteredItems = cat.items.filter((item) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesVeg = !vegOnly || item.isVeg;

        return matchesSearch && matchesVeg;
      });

      return {
        ...cat,
        items: filteredItems,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const categoryIcons: Record<string, string> = {
    wraps: '🌯',
    burgers: '🍔',
    'fried-chicken': '🍗',
    snacks: '🍟',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 pb-28">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          {/* Top row: Brand & Dine-in/Takeaway badge */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
                <span>{shopName}</span>
                <span className="text-amber-500">⚡</span>
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Fast, Fresh & Crisp Wraps
              </p>
            </div>

            {/* Table / Takeaway Pill */}
            <div>
              {isDineIn ? (
                <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dine-in: Table #{tableNumber}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Takeaway</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Input & Veg Filter Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search wraps, burgers, snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Veg Only Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                vegOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Veg</span>
            </button>
          </div>
        </div>

        {/* 2. Sticky Horizontal Category Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <nav
            aria-label="Menu categories"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-neutral-100"
          >
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.slug)}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-sm font-black border border-amber-400'
                      : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  <span>{categoryIcons[cat.slug] || '🍽️'}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 3. Menu Category Sections */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-neutral-500 text-sm">
              No menu items match your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              id={cat.slug}
              ref={(el) => {
                sectionRefs.current[cat.slug] = el;
              }}
              className="space-y-3 scroll-mt-36"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <h2 className="font-black text-lg text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{categoryIcons[cat.slug] || '🍽️'}</span>
                  <span>{cat.name}</span>
                </h2>
                <span className="text-xs text-neutral-500 font-semibold">
                  {cat.items.length} {cat.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating WhatsApp Help Button */}
      <a
        href={`https://wa.me/${(shopPhone || '918686878675').replace(/\D/g, '')}?text=${encodeURIComponent('Hi Wrap Nation! I need help with my menu order.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-40 py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-emerald-500"
        aria-label="Chat with Wrap Nation on WhatsApp"
      >
        <span className="text-base">💬</span>
        <span className="font-black">WhatsApp</span>
      </a>

      {/* 4. Bottom Sticky Cart Bar */}
      <BottomCartBar />
    </div>
  );
}
