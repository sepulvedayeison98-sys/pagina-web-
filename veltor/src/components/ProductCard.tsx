"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import Placeholder from "./Placeholder";
import Stars from "./Stars";

/** Card de producto con hover-lift y press. */
export default function ProductCard({ product }: { product: Product }) {
  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.018 }}
      whileTap={{ y: -3, scale: 0.99 }}
      transition={{ type: "spring", bounce: 0.28, duration: 0.5 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-text-dark/10 bg-white"
    >
      <Link href={`/producto/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden">
          <Placeholder className="h-full w-full" label={product.name} />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[0.6rem] font-mono uppercase tracking-widest text-text-light">
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
