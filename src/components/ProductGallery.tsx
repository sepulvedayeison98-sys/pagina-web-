"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Placeholder from "./Placeholder";
import { GALLERY_VIEW_LABELS } from "@/lib/products";

/**
 * Galería con miniaturas clicables. Si hay fotos reales (`images`) las muestra;
 * si no, cae a placeholders con etiquetas de vista.
 */
export default function ProductGallery({
  images = [],
  name,
}: {
  images?: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const hasPhotos = images.length > 0;
  const slots = hasPhotos ? images : GALLERY_VIEW_LABELS;

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
            <Placeholder
              className="h-full w-full"
              src={hasPhotos ? slots[active] : undefined}
              alt={name}
              label={hasPhotos ? undefined : (slots[active] as string)}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={i === active}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
              i === active
                ? "border-accent"
                : "border-transparent hover:border-text-light/25"
            }`}
          >
            <Placeholder
              className="h-full w-full"
              src={hasPhotos ? (slot as string) : undefined}
              alt={name}
              compact
            />
          </button>
        ))}
      </div>
    </div>
  );
}
