"use client";

import { useState } from "react";
import { SIZES, type Size } from "@/lib/products";

/** Selector de talla funcional (XS–XL). */
export default function SizeSelector() {
  const [size, setSize] = useState<Size | null>(null);

  return (
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
              onClick={() => setSize(s)}
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
      {!size && (
        <p className="mt-2 text-xs text-text-dark/45">
          Selecciona una talla para continuar.
        </p>
      )}
    </div>
  );
}
