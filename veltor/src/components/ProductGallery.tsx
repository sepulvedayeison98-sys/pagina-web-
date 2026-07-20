"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Placeholder from "./Placeholder";

/** Galería con miniaturas clicables. La vista activa se resalta. */
export default function ProductGallery({ views }: { views: string[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <Placeholder className="h-full w-full" label={views[active]} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {views.map((view, i) => (
          <button
            key={view}
            onClick={() => setActive(i)}
            aria-label={`Ver ${view}`}
            aria-pressed={i === active}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
              i === active
                ? "border-accent"
                : "border-transparent hover:border-text-dark/20"
            }`}
          >
            <Placeholder className="h-full w-full" compact />
          </button>
        ))}
      </div>
    </div>
  );
}
