'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/customer/cartContext';
import { ShoppingBag } from 'lucide-react';

export default function TakeawayEntryPage() {
  const router = useRouter();
  const { setTableInfo } = useCart();

  useEffect(() => {
    // Clear table token for takeaway ordering
    setTableInfo(null, null);
    const timer = setTimeout(() => {
      router.replace('/menu');
    }, 400);
    return () => clearTimeout(timer);
  }, [router, setTableInfo]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-md animate-pulse">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Takeaway Mode</h1>
        <p className="text-sm text-neutral-500 font-medium">Loading your menu for takeaway...</p>
      </div>
    </div>
  );
}
