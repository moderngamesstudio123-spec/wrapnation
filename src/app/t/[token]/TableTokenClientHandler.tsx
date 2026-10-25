'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/customer/cartContext';
import { UtensilsCrossed } from 'lucide-react';

interface TableTokenClientHandlerProps {
  token: string;
  tableNumber: number;
}

export default function TableTokenClientHandler({
  token,
  tableNumber,
}: TableTokenClientHandlerProps) {
  const router = useRouter();
  const { setTableInfo } = useCart();

  useEffect(() => {
    setTableInfo(token, tableNumber);
    // Smooth transition to menu
    const timer = setTimeout(() => {
      router.replace('/menu');
    }, 600);
    return () => clearTimeout(timer);
  }, [token, tableNumber, router, setTableInfo]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center mx-auto shadow-md animate-bounce">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Table #{tableNumber} Verified</h1>
        <p className="text-sm text-neutral-500">
          Welcome to Wrap Nation! Loading your menu...
        </p>
      </div>
    </div>
  );
}
