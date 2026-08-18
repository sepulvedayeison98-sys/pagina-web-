"use client";

import { useEffect, useRef } from "react";

/**
 * Comportamiento común de las capas modales (carrito, buscador, guía de tallas):
 *
 *  - Cierra con Escape.
 *  - Bloquea el scroll del fondo mientras está abierta. Sin esto, en móvil la
 *    página de atrás se desplaza bajo el dedo y la interacción se siente rota.
 *    El salto de layout al ocultar la barra se evita con `scrollbar-gutter:
 *    stable` en el <html> (ver globals.css), no con relleno calculado.
 *  - Lleva el foco al panel al abrir y lo devuelve al elemento que lo abrió al
 *    cerrar, para que el teclado y los lectores de pantalla no se queden atrás.
 *
 * Devuelve un ref que hay que poner en el panel, junto con `tabIndex={-1}`
 * para que pueda recibir el foco. Si la capa enfoca otra cosa (el buscador
 * enfoca su input), basta con no usar el ref.
 */
export function useModal(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Pequeño retraso: el panel entra animado y aún no está montado del todo.
    const focusId = window.setTimeout(() => panelRef.current?.focus(), 60);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusId);
      opener?.focus?.();
    };
  }, [open, onClose]);

  return panelRef;
}
