"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Check } from "lucide-react";
import Cta from "./Cta";
import { SIZES, type Size } from "@/lib/products";
import { useCart } from "@/lib/cart/CartContext";

/**
 * Caja de compra de la ficha: selección de talla + "Agregar al carrito"
 * (conectado al carrito real) + "Guardar". Requiere elegir talla antes de
 * agregar. Al agregar, el carrito se abre solo (ver CartContext).
 */
export default function ProductBuy({
  slug,
  name,
  price,
  imageUrl,
}: {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}) {
  const { add } = useCart();
  const [size, setSize] = useState<Size | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!size) {
      setError(true);
      return;
    }
    add({ slug, name, price, imageUrl, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div>
      {/* Selector de talla */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow text-text-dark/60">Talla</span>
          <button className="text-xs text-accent underline-offset-2 hover:underline">
            Guía de tallas
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const on = s === size;
            return (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setError(false);
                }}
                aria-pressed={on}
                className={`h-11 w-14 rounded-xl border text-sm font-semibold transition-colors ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-text-dark/20 text-text-dark hover:border-text-dark/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-600">
            Selecciona una talla para continuar.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Cta variant="primary" full className="sm:flex-1" onClick={handleAdd}>
          {added ? (
            <>
              <Check size={18} /> Agregado
            </>
          ) : (
            <>
              <ShoppingBag size={18} /> Agregar al carrito
            </>
          )}
        </Cta>
        <Cta variant="secondary">
          <Heart size={18} /> Guardar
        </Cta>
      </div>
    </div>
  );
}
