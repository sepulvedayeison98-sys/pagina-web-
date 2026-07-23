"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Check } from "lucide-react";
import Cta from "./Cta";
import SizeGuideModal from "./SizeGuideModal";
import { SIZES, type Size } from "@/lib/products";
import { useCart } from "@/lib/cart/CartContext";
import { useFavorites } from "@/lib/favorites/FavoritesContext";

/**
 * Caja de compra de la ficha: selección de talla + "Agregar al carrito"
 * (conectado al carrito real) + "Guardar" (favoritos con persistencia).
 * El enlace "Guía de tallas" abre el modal con la lámina de tallas.
 * Requiere elegir talla antes de agregar; al agregar, el carrito se abre solo.
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
  const { isFavorite, toggle } = useFavorites();
  const [size, setSize] = useState<Size | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const saved = isFavorite(slug);

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
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
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
        <Cta
          variant="secondary"
          onClick={() => toggle(slug)}
          className={saved ? "border-accent text-accent" : ""}
        >
          <Heart size={18} className={saved ? "fill-accent" : ""} />
          {saved ? "Guardado" : "Guardar"}
        </Cta>
      </div>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
