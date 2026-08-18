"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Search, X, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useModal } from "@/lib/useModal";
import { formatCOP } from "@/lib/format";

interface Hit {
  slug: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
}

/** Modal de búsqueda: trae los productos activos una vez y filtra en vivo por nombre o categoría. */
export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Hit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar catálogo la primera vez que se abre.
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select("slug,name,category,price,image_url")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (!cancelled && data) setProducts(data as Hit[]);
      } catch {
        // sin resultados si falla la red
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  // Escape, bloqueo del scroll de fondo y devolución del foco al cerrar.
  useModal(open, onClose);

  // El foco va al buscador, no al panel: es lo que el usuario quiere usar.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex flex-col bg-ink/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[12vh] w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-2xl bg-paper shadow-2xl">
              <div className="flex items-center gap-3 border-b border-text-dark/10 px-4">
                <Search size={20} className="shrink-0 text-text-dark/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca un casco o categoría…"
                  className="flex-1 bg-transparent py-4 text-base text-text-dark placeholder:text-text-dark/40 focus:outline-none"
                />
                <button
                  onClick={onClose}
                  aria-label="Cerrar búsqueda"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-dark/50 hover:bg-text-dark/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto">
                {!loaded ? (
                  <p className="px-4 py-8 text-center text-sm text-text-dark/50">
                    Cargando catálogo…
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-text-dark/50">
                    Sin resultados para “{query}”.
                  </p>
                ) : (
                  <ul className="divide-y divide-text-dark/5 py-1">
                    {results.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/producto/${p.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white"
                        >
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-studio">
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-text-dark/30">
                                <ImageOff size={16} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">
                              {p.name}
                            </span>
                            <span className="text-xs text-text-dark/50">
                              {p.category}
                            </span>
                          </span>
                          <span className="shrink-0 font-bold text-accent">
                            {formatCOP(p.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
