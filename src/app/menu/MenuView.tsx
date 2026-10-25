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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-28">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          {/* Top row: Brand & Dine-in/Takeaway badge */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{shopName}</span>
                <span className="text-amber-400">⚡</span>
              </h1>
              <p className="text-xs text-neutral-400 font-medium">
                Fast, Fresh & Crisp Wraps
              </p>
            </div>

            {/* Table / Takeaway Pill */}
            <div>
              {isDineIn ? (
                <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold shadow-sm">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Dine-in: Table #{tableNumber}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Takeaway</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Input & Veg Filter Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search wraps, burgers, snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
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
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
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
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-neutral-900"
          >
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.slug)}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {cat.name}
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
            <p className="text-neutral-400 text-sm">
              No menu items match your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-neutral-800 text-amber-400 hover:bg-neutral-700 transition"
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
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <h2 className="font-black text-lg text-white uppercase tracking-wider">
                  {cat.name}
                </h2>
                <span className="text-xs text-neutral-500 font-semibold">
                  {cat.items.length} {cat.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* 4. Bottom Sticky Cart Bar */}
      <BottomCartBar />
    </div>
  );
}
