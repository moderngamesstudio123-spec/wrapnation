'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartAddOn {
  id: string;
  name: string;
  price: number; // in paise
}

export interface CartItem {
  key: string;
  menuItemId: string;
  name: string;
  isVeg: boolean;
  basePrice: number;
  variantId?: string | null;
  variantName?: string | null;
  variantDelta: number;
  addOns: CartAddOn[];
  unitPrice: number; // basePrice + variantDelta + sum(addOns)
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  tableToken: string | null;
  tableNumber: number | null;
  isDineIn: boolean;
  customerName: string;
  customerPhone: string;
  cookingNote: string;
  whatsappOptIn: boolean;
  paymentMethod: 'UPI' | 'CASH';
  totalItemsCount: number;
  subtotalPaise: number;
  setTableInfo: (token: string | null, tableNum: number | null) => void;
  setCustomerDetails: (name: string, phone: string) => void;
  setCookingNote: (note: string) => void;
  setWhatsappOptIn: (optIn: boolean) => void;
  setPaymentMethod: (method: 'UPI' | 'CASH') => void;
  addItem: (
    item: { id: string; name: string; basePrice: number; isVeg: boolean },
    variant?: { id: string; name: string; priceDelta: number } | null,
    addOns?: CartAddOn[]
  ) => void;
  updateQuantity: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  getItemQuantity: (menuItemId: string) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableToken, setTableTokenState] = useState<string | null>(null);
  const [tableNumber, setTableNumberState] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [cookingNote, setCookingNote] = useState<string>('');
  const [whatsappOptIn, setWhatsappOptIn] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wn_cart_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.tableToken) setTableTokenState(parsed.tableToken);
        if (parsed.tableNumber) setTableNumberState(parsed.tableNumber);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
      }
    } catch {}
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'wn_cart_v1',
        JSON.stringify({
          items,
          tableToken,
          tableNumber,
          customerName,
          customerPhone,
        })
      );
    } catch {}
  }, [items, tableToken, tableNumber, customerName, customerPhone]);

  const setTableInfo = (token: string | null, tableNum: number | null) => {
    setTableTokenState(token);
    setTableNumberState(tableNum);
  };

  const setCustomerDetails = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
  };

  const generateCartKey = (
    menuItemId: string,
    variantId?: string | null,
    addOns: CartAddOn[] = []
  ): string => {
    const sortedAddonIds = addOns.map((a) => a.id).sort().join('-');
    return `${menuItemId}_${variantId || 'base'}_${sortedAddonIds}`;
  };

  const addItem = (
    item: { id: string; name: string; basePrice: number; isVeg: boolean },
    variant?: { id: string; name: string; priceDelta: number } | null,
    addOns: CartAddOn[] = []
  ) => {
    const key = generateCartKey(item.id, variant?.id, addOns);
    const variantDelta = variant?.priceDelta || 0;
    const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = item.basePrice + variantDelta + addOnsTotal;

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          isVeg: item.isVeg,
          basePrice: item.basePrice,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          variantDelta,
          addOns,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.key === key) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const getItemQuantity = (menuItemId: string): number => {
    return items
      .filter((i) => i.menuItemId === menuItemId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const clearCart = () => {
    setItems([]);
    setCookingNote('');
  };

  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalPaise = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const isDineIn = !!tableToken && !!tableNumber;

  return (
    <CartContext.Provider
      value={{
        items,
        tableToken,
        tableNumber,
        isDineIn,
        customerName,
        customerPhone,
        cookingNote,
        whatsappOptIn,
        paymentMethod,
        totalItemsCount,
        subtotalPaise,
        setTableInfo,
        setCustomerDetails,
        setCookingNote,
        setWhatsappOptIn,
        setPaymentMethod,
        addItem,
        updateQuantity,
        removeItem,
        getItemQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
