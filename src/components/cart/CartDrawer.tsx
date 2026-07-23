"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatCOP } from "@/lib/format";
import { WHATSAPP_NUMBER, STORE_NAME } from "@/lib/config";

/**
 * Arma el texto del pedido y devuelve el enlace wa.me para finalizar por WhatsApp.
 * Usa el formato nativo de WhatsApp (*negrita*, _cursiva_) y un layout ordenado:
 * cabecera, cada producto numerado con talla/cantidad/precio, y un total
 * destacado, con campos para que el cliente complete envío y pago.
 *
 * Nota: se evitan emojis a propósito. Al abrir wa.me en iOS, los caracteres
 * del plano astral (emojis, 4 bytes) se corrompen en el texto prellenado y
 * llegan como "�". Los acentos y los separadores (planos básicos) sí viajan
 * bien, así que la estructura se apoya solo en negritas y líneas divisorias.
 */
function buildWhatsAppLink(
  items: { name: string; size: string; qty: number; price: number }[],
  subtotal: number
) {
  const divider = "━━━━━━━━━━━━━━━";

  const productos = items
    .map(
      (i, idx) =>
        `*${idx + 1}.* ${i.name}\n` +
        `      Talla ${i.size}  ·  ${i.qty} und\n` +
        `      ${formatCOP(i.price * i.qty)}`
    )
    .join("\n\n");

  const text =
    `*PEDIDO ${STORE_NAME.toUpperCase()}*\n` +
    `${divider}\n\n` +
    `${productos}\n\n` +
    `${divider}\n` +
    `*TOTAL:  ${formatCOP(subtotal)}*\n` +
    `${divider}\n\n` +
    `*Envío a:* _(ciudad y dirección)_\n` +
    `*Pago:* _(transferencia / contraentrega)_\n\n` +
    `¡Quedo atento para confirmar disponibilidad!`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, count, clear } =
    useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscurecido */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="fixed right-0 top-0 z-[61] flex h-[100dvh] w-full max-w-md flex-col bg-paper text-text-dark shadow-2xl"
            role="dialog"
            aria-label="Carrito de compras"
          >
            <header className="flex items-center justify-between border-b border-text-dark/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <h2 className="font-display text-lg font-bold">
                  Tu carrito
                  {count > 0 && (
                    <span className="ml-1 text-text-dark/50">({count})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="Cerrar carrito"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-dark/60 transition-colors hover:bg-text-dark/5 hover:text-text-dark"
              >
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <ShoppingBag size={40} className="text-text-dark/20" />
                <p className="text-text-dark/60">Tu carrito está vacío.</p>
                <button
                  onClick={close}
                  className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Ver catálogo
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-text-dark/10 overflow-y-auto px-5">
                  {items.map((item) => (
                    <li key={item.slug + item.size} className="flex gap-3 py-4">
                      <Link
                        href={`/producto/${item.slug}`}
                        onClick={close}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-studio"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-text-dark/30">
                            <ShoppingBag size={18} />
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-tight">
                              {item.name}
                            </p>
                            <p className="text-xs text-text-dark/50">
                              Talla {item.size}
                            </p>
                          </div>
                          <button
                            onClick={() => remove(item.slug, item.size)}
                            aria-label="Quitar del carrito"
                            className="shrink-0 text-text-dark/35 transition-colors hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-text-dark/15">
                            <button
                              onClick={() =>
                                setQty(item.slug, item.size, item.qty - 1)
                              }
                              aria-label="Menos"
                              className="flex h-8 w-8 items-center justify-center text-text-dark/60 hover:text-text-dark"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {item.qty}
                            </span>
                            <button
                              onClick={() =>
                                setQty(item.slug, item.size, item.qty + 1)
                              }
                              aria-label="Más"
                              className="flex h-8 w-8 items-center justify-center text-text-dark/60 hover:text-text-dark"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold text-accent">
                            {formatCOP(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-text-dark/10 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-text-dark/60">Subtotal</span>
                    <span className="text-lg font-extrabold">
                      {formatCOP(subtotal)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-text-dark/45">
                    El envío y los detalles finales se coordinan por WhatsApp.
                  </p>
                  <a
                    href={buildWhatsAppLink(items, subtotal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    Finalizar pedido por WhatsApp
                  </a>
                  <button
                    onClick={clear}
                    className="mt-2 w-full py-1 text-center text-xs text-text-dark/45 transition-colors hover:text-red-600"
                  >
                    Vaciar carrito
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
