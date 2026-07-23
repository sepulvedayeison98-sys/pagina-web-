"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import guiaTallas from "@/assets/guia-tallas.webp";

/** Tallas y su circunferencia de cabeza (cm), según la guía VELTOR. */
const ROWS = [
  { size: "S", cm: "55 – 56 cm" },
  { size: "M", cm: "57 – 58 cm" },
  { size: "L", cm: "59 – 60 cm" },
  { size: "XL", cm: "61 – 62 cm" },
];

/**
 * Modal con la guía de tallas de VELTOR. Muestra la lámina de marca (imagen)
 * como pieza principal y una tabla en texto debajo para que las medidas se
 * lean nítidas y sean accesibles en cualquier pantalla. Cierra con Escape,
 * clic en el fondo o el botón X.
 */
export default function SizeGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-md sm:items-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Guía de tallas"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar guía de tallas"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-white backdrop-blur transition-colors hover:bg-ink/70"
            >
              <X size={18} />
            </button>

            {/* Lámina de marca */}
            <Image
              src={guiaTallas}
              alt="Guía de tallas VELTOR: mide la circunferencia de tu cabeza 1 pulgada sobre las cejas. S 55-56 cm, M 57-58 cm, L 59-60 cm, XL 61-62 cm."
              placeholder="blur"
              sizes="(max-width: 640px) 100vw, 42rem"
              className="h-auto w-full"
            />

            {/* Tabla en texto (nítida y accesible en móvil) */}
            <div className="px-5 py-6 sm:px-8">
              <h3 className="eyebrow mb-4 text-text-dark/60">
                Tabla de tallas
              </h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-text-dark/15 text-left text-text-dark/50">
                    <th className="pb-2 font-semibold">Talla</th>
                    <th className="pb-2 font-semibold">
                      Circunferencia de cabeza
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr
                      key={r.size}
                      className="border-b border-text-dark/10 last:border-0"
                    >
                      <td className="py-2.5">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-ink px-2 font-bold text-white">
                          {r.size}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-text-dark">
                        {r.cm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-5 text-xs leading-relaxed text-text-dark/55">
                Mide el contorno de tu cabeza en la parte más ancha, aprox. 1
                pulgada por encima de las cejas. Si quedas entre dos tallas,
                elige la mayor. El casco debe sentirse firme, sin puntos de
                presión.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
