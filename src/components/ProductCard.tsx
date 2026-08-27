"use client";

import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type { PointerEvent } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import { categoryLabel } from "@/lib/products";
import { useCart } from "@/lib/cart/CartContext";
import { useFavorites } from "@/lib/favorites/FavoritesContext";
import Placeholder from "./Placeholder";
import Stars from "./Stars";

/**
 * Card de producto con:
 *  - hover-lift (reposición con spring crítico) + press,
 *  - "spotlight" que sigue al cursor (brillo rojo tenue rastreando el puntero).
 * El spotlight usa motion values, se desactiva bajo reduced-motion.
 */
export default function ProductCard({ product }: { product: Product }) {
  const reduce = useReducedMotion();
  const cart = useCart();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.slug);

  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${px}% ${py}%, rgba(216,30,36,0.18), transparent 70%)`;

  function handleMove(e: PointerEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 100);
    py.set(((e.clientY - r.top) / r.height) * 100);
  }

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round((1 - product.price / product.compareAt) * 100)
      : null;
  const badgeLabel = product.badge || (discount ? `-${discount}%` : null);

  function agregarAlCarrito() {
    const size = product.sizes[0] ?? "Única";
    cart.add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size,
    });
    cart.open();
  }

  return (
    <motion.article
      onPointerMove={handleMove}
      whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
      whileTap={reduce ? undefined : { y: -3, scale: 0.99 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink text-text-light"
    >
      {/* capa spotlight */}
      <motion.span
        aria-hidden
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(product.slug);
        }}
        aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
        aria-pressed={fav}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:text-accent"
      >
        <Heart size={15} fill={fav ? "currentColor" : "none"} className={fav ? "text-accent" : ""} />
      </button>

      <Link href={`/producto/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden">
          <motion.div
            className="h-full w-full"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          >
            <Placeholder
              className="h-full w-full"
              src={product.imageUrl}
              alt={product.name}
              label={product.name}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </motion.div>
          {badgeLabel && (
            <span className="absolute left-3 top-3 z-20 rounded-full bg-accent px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-white">
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="eyebrow text-text-light/40">{categoryLabel(product.category)}</span>
          <h3 className="text-base font-semibold leading-snug">{product.name}</h3>

          <div className="flex items-center gap-2">
            <Stars rating={product.rating} size={14} emptyClassName="text-text-light/25" />
            <span className="text-xs text-text-light/45">
              ({product.reviewCount})
            </span>
          </div>

          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-bold text-accent">
              {formatCOP(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-sm text-text-light/35 line-through">
                {formatCOP(product.compareAt)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="relative z-20 px-4 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            agregarAlCarrito();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <ShoppingCart size={15} /> Agregar al carrito
        </button>
      </div>
    </motion.article>
  );
}
