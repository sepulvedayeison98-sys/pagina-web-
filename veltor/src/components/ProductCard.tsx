"use client";

import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type { PointerEvent } from "react";
import type { Product } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import Placeholder from "./Placeholder";
import Stars from "./Stars";

/**
 * Card de producto con:
 *  - hover-lift (reposición con spring crítico) + press,
 *  - "spotlight" que sigue al cursor (brillo naranja tenue rastreando el puntero).
 * El spotlight usa motion values, se desactiva bajo reduced-motion.
 */
export default function ProductCard({ product }: { product: Product }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${px}% ${py}%, rgba(242,102,31,0.14), transparent 70%)`;

  function handleMove(e: PointerEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 100);
    py.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <motion.article
      onPointerMove={handleMove}
      whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
      whileTap={reduce ? undefined : { y: -3, scale: 0.99 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-text-dark/10 bg-white"
    >
      {/* capa spotlight */}
      <motion.span
        aria-hidden
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

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
          {product.badge && (
            <span className="absolute left-3 top-3 z-20 rounded-full bg-ink px-3 py-1 text-[0.6rem] font-mono uppercase tracking-widest text-text-light">
              {product.badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="eyebrow text-text-dark/40">{product.category}</span>
          <h3 className="text-base font-semibold leading-snug">{product.name}</h3>

          <div className="flex items-center gap-2">
            <Stars rating={product.rating} size={14} />
            <span className="text-xs text-text-dark/50">
              ({product.reviewCount})
            </span>
          </div>

          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-bold text-accent">
              {formatCOP(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-sm text-text-dark/40 line-through">
                {formatCOP(product.compareAt)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
