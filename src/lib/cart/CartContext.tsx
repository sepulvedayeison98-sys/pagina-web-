"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  size: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "rovex-cart-v1";

/**
 * Estado global del carrito. Guarda los productos en localStorage, así que
 * el carrito sobrevive al recargar y cambiar de página. Las líneas se
 * identifican por producto + talla (mismo casco en 2 tallas = 2 líneas).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Carga inicial desde localStorage tras el montaje (no en el render, para
    // no romper la hidratación: el servidor no conoce el carrito guardado).
    let restored: CartItem[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as CartItem[];
    } catch {
      // ignorar JSON corrupto
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored) setItems(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // almacenamiento lleno/bloqueado: no es crítico
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (p) => p.slug === item.slug && p.size === item.size
      );
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setItems((prev) => prev.filter((p) => !(p.slug === slug && p.size === size)));
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => !(p.slug === slug && p.size === size))
        : prev.map((p) =>
            p.slug === slug && p.size === size ? { ...p, qty } : p
          )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const count = items.reduce((n, p) => n + p.qty, 0);
  const subtotal = items.reduce((s, p) => s + p.price * p.qty, 0);

  const value = useMemo<CartState>(
    () => ({
      items,
      isOpen,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      open,
      close,
    }),
    [items, isOpen, count, subtotal, add, remove, setQty, clear, open, close]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
