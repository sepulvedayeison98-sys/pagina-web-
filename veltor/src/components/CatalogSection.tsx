"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PRODUCTS, type Category } from "@/lib/products";
import ProductCard from "./ProductCard";

type Filter = "TODOS" | Category;

const FILTERS: Filter[] = ["TODOS", "INTEGRAL", "JET", "MODULAR", "OFFROAD"];

/** Catálogo con filtro por pills funcional. */
export default function CatalogSection() {
  const [active, setActive] = useState<Filter>("TODOS");

  const items =
    active === "TODOS"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === active);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f === active;
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              aria-pressed={on}
              className={`rounded-full border px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
                on
                  ? "border-ink bg-ink text-text-light"
                  : "border-text-dark/20 text-text-dark/60 hover:border-text-dark/50"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <motion.ul
        layout
        className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {items.map((product) => (
            <motion.li
              key={product.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            >
              <ProductCard product={product} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
