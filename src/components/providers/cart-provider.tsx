"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { CategoryType } from "@/src/lib/catalog";
import { calculateOrderTotal } from "@/src/lib/cart";
import type { CartItem } from "@/src/lib/types";
import type { CartItemInput } from "@/src/lib/validation";

const STORAGE_KEY = "pawfect-beads-cart-v1";

type CartProductSnapshot = {
  name: string;
  price: number;
  categoryType: CategoryType;
  allowCharm: boolean;
};

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  totalAmount: number;
  addItem: (input: CartItemInput, product: CartProductSnapshot) => void;
  updateItem: (id: string, input: CartItemInput, product: CartProductSnapshot) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemById: (id: string) => CartItem | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReady(true);
        return;
      }

      try {
        setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const totalAmount = useMemo(() => calculateOrderTotal(items), [items]);

  const addItem = (input: CartItemInput, product: CartProductSnapshot) => {
    const safeId = input.id?.trim() || crypto.randomUUID();

    setItems((prev) => [
      ...prev,
      {
        ...input,
        id: safeId,
        addOnCharmQuantity: product.allowCharm ? input.addOnCharmQuantity : 0,
        referenceImageUrl: input.referenceImageUrl || undefined,
        productName: product.name,
        unitPrice: product.price,
        categoryType: product.categoryType,
        allowCharm: product.allowCharm,
      },
    ]);
  };

  const updateItem = (id: string, input: CartItemInput, product: CartProductSnapshot) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              id,
              addOnCharmQuantity: product.allowCharm ? input.addOnCharmQuantity : 0,
              referenceImageUrl: input.referenceImageUrl || undefined,
              productName: product.name,
              unitPrice: product.price,
              categoryType: product.categoryType,
              allowCharm: product.allowCharm,
            }
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              addOnCharmQuantity: item.allowCharm ? Math.min(item.addOnCharmQuantity ?? 0, quantity) : 0,
            }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemById = (id: string) => items.find((item) => item.id === id);

  return (
    <CartContext.Provider
      value={{
        items,
        isReady,
        totalAmount,
        addItem,
        updateItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemById,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart 必須在 CartProvider 內使用");
  }

  return context;
}
