"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { useCart } from "@/lib/cart/CartContext";

/** Glifo oficial de WhatsApp: lucide-react no incluye logos de marca. */
function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.26.86 5.81 2.42a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Z" />
    </svg>
  );
}

/**
 * Botón flotante para escribir por WhatsApp desde cualquier página.
 *
 * Se oculta mientras el carrito está abierto (el panel lo taparía y su
 * propio botón de finalizar ya cumple esa función) y en el panel /admin.
 */
export default function WhatsAppFab() {
  const pathname = usePathname();
  const { isOpen } = useCart();
  const reduce = useReducedMotion();

  if (pathname.startsWith("/admin") || isOpen) return null;

  const mensaje =
    "Hola ROVEX, estoy viendo la tienda y quiero información sobre un casco.";
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: reduce ? 0 : 1.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,.7)] sm:bottom-7 sm:right-7"
    >
      <WhatsAppIcon />
      {/* Halo que late para atraer la mirada sin ser molesto. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-text-light opacity-0 transition-opacity group-hover:opacity-100 sm:block">
        Escríbenos
      </span>
    </motion.a>
  );
}
