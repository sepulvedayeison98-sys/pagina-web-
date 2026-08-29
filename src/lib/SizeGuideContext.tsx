"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import SizeGuideModal from "@/components/SizeGuideModal";

const SizeGuideContext = createContext<(() => void) | null>(null);

/**
 * Un solo modal de guía de tallas compartido por toda la ficha de producto
 * (galería y selector de talla). Antes cada uno tenía su propia instancia:
 * si se abrían las dos, cada una bloqueaba el scroll y se cerraba por su
 * cuenta, así que cerrar una dejaba la otra debajo — parecía que la guía no
 * se podía cerrar. Con un solo estado compartido eso deja de ser posible.
 */
export function SizeGuideProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openGuide = useMemo(() => () => setOpen(true), []);

  return (
    <SizeGuideContext.Provider value={openGuide}>
      {children}
      <SizeGuideModal open={open} onClose={() => setOpen(false)} />
    </SizeGuideContext.Provider>
  );
}

/** Llama a esto para abrir la guía de tallas compartida. */
export function useSizeGuide(): () => void {
  const openGuide = useContext(SizeGuideContext);
  if (!openGuide) {
    throw new Error("useSizeGuide debe usarse dentro de SizeGuideProvider");
  }
  return openGuide;
}
