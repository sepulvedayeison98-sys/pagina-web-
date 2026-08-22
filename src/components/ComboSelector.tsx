"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { useModal } from "@/lib/useModal";
import { formatCOP } from "@/lib/format";
import type { ComboData } from "@/lib/data";

/**
 * Elección de los dos cascos del combo.
 *
 * El cliente escoge diseño y talla de cada uno sin salir de la portada, y
 * al confirmar entra al carrito como UN solo renglón con el precio del
 * combo. Los cascos concretos viajan en `components`, para que al confirmar
 * el pedido el inventario descuente esas unidades y no el combo.
 */
/**
 * Un casco dentro del combo: diseño (solo si hay más de uno) y talla.
 * Va fuera del componente padre para que no se vuelva a crear en cada
 * render y pierda el estado a media selección.
 */
function Casco({
  n,
  value,
  onChange,
  options,
  unico,
  onPick,
}: {
  n: number;
  value: { slug: string; size: string };
  onChange: (v: { slug: string; size: string }) => void;
  options: ComboData["options"];
  unico: boolean;
  onPick: () => void;
}) {
  const opcion = options.find((o) => o.slug === value.slug);
  return (
    <div className="rounded-xl border border-text-dark/15 p-4">
      <p className="mb-3 font-semibold">Casco {n}</p>

      {!unico && (
        <>
          <span className="eyebrow mb-2 block text-text-dark/55">Diseño</span>
          <div className="mb-4 flex flex-wrap gap-2">
            {options.map((o) => {
              const on = o.slug === value.slug;
              return (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => onChange({ slug: o.slug, size: "" })}
                  aria-pressed={on}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    on
                      ? "border-accent bg-accent text-white"
                      : "border-text-dark/20 hover:border-text-dark/50"
                  }`}
                >
                  {o.variant || o.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <span className="eyebrow mb-2 block text-text-dark/55">Talla</span>
      <div className="flex flex-wrap gap-2">
        {(opcion?.sizes ?? []).map((s) => {
          const on = s === value.size;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange({ ...value, size: s });
                onPick();
              }}
              aria-pressed={on}
              className={`h-10 w-12 rounded-lg border text-sm font-semibold transition-colors ${
                on
                  ? "border-accent bg-accent text-white"
                  : "border-text-dark/20 hover:border-text-dark/50"
              }`}
            >
              {s}
            </button>
          );
        })}
        {!opcion && (
          <span className="text-sm text-text-dark/45">
            Elige primero el diseño.
          </span>
        )}
      </div>
    </div>
  );
}

export default function ComboSelector({
  combo,
  open,
  onClose,
}: {
  combo: ComboData;
  open: boolean;
  onClose: () => void;
}) {
  const { add, open: openCart } = useCart();
  const panelRef = useModal(open, onClose);

  const unico = combo.options.length === 1;
  const vacio = { slug: unico ? combo.options[0].slug : "", size: "" };
  const [uno, setUno] = useState({ ...vacio });
  const [dos, setDos] = useState({ ...vacio });
  const [error, setError] = useState(false);

  const listo = uno.slug && uno.size && dos.slug && dos.size;

  function nombreDe(slug: string) {
    const o = combo.options.find((x) => x.slug === slug);
    return o?.variant || o?.name || "";
  }

  function handleAdd() {
    if (!listo) {
      setError(true);
      return;
    }
    add({
      slug: combo.slug,
      name: combo.name,
      price: combo.price,
      imageUrl: combo.imageUrl,
      size: `${uno.size} + ${dos.size}`,
      detail: [
        `Casco 1: talla ${uno.size}${unico ? "" : ` · ${nombreDe(uno.slug)}`}`,
        `Casco 2: talla ${dos.size}${unico ? "" : ` · ${nombreDe(dos.slug)}`}`,
      ],
      components: [
        { slug: uno.slug, size: uno.size },
        { slug: dos.slug, size: dos.size },
      ],
    });
    onClose();
    openCart();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-md sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Arma tu combo"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-lg rounded-2xl bg-paper p-6 text-text-dark shadow-2xl focus:outline-none"
            ref={panelRef as React.Ref<HTMLDivElement>}
            tabIndex={-1}
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 text-text-dark/40 hover:text-text-dark"
            >
              <X size={20} />
            </button>

            <p className="eyebrow mb-1 text-accent">Arma tu combo</p>
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight">
              {combo.name}
            </h2>
            <p className="mb-5 text-sm text-text-dark/60">
              Elige la talla de cada casco. Puedes pedirlos en tallas distintas.
            </p>

            <div className="space-y-3">
              <Casco
                n={1}
                value={uno}
                onChange={setUno}
                options={combo.options}
                unico={unico}
                onPick={() => setError(false)}
              />
              <Casco
                n={2}
                value={dos}
                onChange={setDos}
                options={combo.options}
                unico={unico}
                onPick={() => setError(false)}
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-warn">
                Elige la talla de los dos cascos para continuar.
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-text-dark/10 pt-5">
              <div>
                <p className="text-2xl font-extrabold text-accent">
                  {formatCOP(combo.price)}
                </p>
                {combo.compareAt && combo.compareAt > combo.price && (
                  <p className="text-xs text-text-dark/50">
                    <span className="line-through">
                      {formatCOP(combo.compareAt)}
                    </span>{" "}
                    · ahorras {formatCOP(combo.compareAt - combo.price)}
                  </p>
                )}
              </div>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                {listo ? <Check size={17} /> : <ShoppingBag size={17} />}
                Agregar al carrito
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
