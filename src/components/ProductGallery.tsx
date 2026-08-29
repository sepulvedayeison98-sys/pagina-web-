"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ruler } from "lucide-react";
import Placeholder from "./Placeholder";
import { GALLERY_VIEW_LABELS } from "@/lib/products";
import { useSizeGuide } from "@/lib/SizeGuideContext";
import guiaTallas from "@/assets/guia-tallas.webp";

/**
 * Galería con miniaturas clicables. Si hay fotos reales (`images`) las muestra;
 * si no, cae a placeholders con etiquetas de vista.
 *
 * La última miniatura no es una foto del casco: abre la guía de tallas (modal
 * compartido vía SizeGuideProvider). Al vivir en este componente compartido,
 * queda anclada a la galería de todas las fichas de producto (existentes y
 * las que se creen después) sin tener que repetirlo en cada una.
 */
export default function ProductGallery({
  images = [],
  name,
}: {
  images?: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const openGuide = useSizeGuide();
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
              fit="contain"
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
              fit="contain"
            />
          </button>
        ))}

        {/* Última miniatura: no es una foto del casco, abre la guía de tallas. */}
        <button
          type="button"
          onClick={openGuide}
          aria-label="Ver guía de tallas"
          className="group relative aspect-square overflow-hidden rounded-xl border-2 border-transparent transition-colors hover:border-text-light/25"
        >
          <Placeholder
            className="h-full w-full"
            src={guiaTallas.src}
            alt="Guía de tallas"
            compact
            fit="contain"
          />
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/70 text-text-light transition-colors group-hover:bg-ink/55">
            <Ruler size={16} />
            <span className="text-[0.6rem] font-semibold uppercase tracking-widest">
              Tallas
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
