"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, ImageOff, GripVertical, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";

export interface ProductListRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  price: number;
  active: boolean;
  badge: string | null;
  image_url: string | null;
}

/**
 * Listado de productos del panel, reordenable arrastrando.
 *
 * El orden se guarda en `sort_order` y es el que usa la tienda para mostrar
 * el catálogo. Se reescribe la columna entera (0,1,2…) al soltar, así nunca
 * quedan huecos ni empates.
 *
 * Se usa la API nativa de arrastrar del navegador (sin librerías): la lista
 * es corta y así no se añade peso al panel.
 */
export default function ProductList({ initial }: { initial: ProductListRow[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setItems((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      const to = prev.findIndex((p) => p.id === overId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  /**
   * Guarda el orden actual. Se hace en UNA sola llamada atómica: si se
   * mandaran N updates en paralelo se pisan entre sí y varios productos
   * acaban con el mismo sort_order, dejando el catálogo en orden aleatorio.
   */
  async function persistOrder() {
    setDragId(null);
    if (saving) return;

    const unchanged = items.every((p, i) => p.id === initial[i]?.id);
    if (unchanged) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase.rpc("reorder_products", {
      ids: items.map((p) => p.id),
    });

    setSaving(false);
    if (error) {
      setError("No se pudo guardar el orden nuevo.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex min-h-5 items-center justify-between text-sm">
        <p className="text-text-dark/50">
          Arrastra desde <GripVertical size={13} className="inline" /> para
          cambiar el orden del catálogo.
        </p>
        {saving && (
          <span className="inline-flex items-center gap-1 text-text-dark/50">
            <Loader2 size={14} className="animate-spin" /> Guardando…
          </span>
        )}
        {saved && !saving && (
          <span className="inline-flex items-center gap-1 text-accent">
            <Check size={14} /> Orden guardado
          </span>
        )}
        {error && <span className="text-warn">{error}</span>}
      </div>

      <ul className="divide-y divide-text-dark/10 overflow-hidden rounded-2xl border border-text-dark/10 bg-white">
        {items.map((p) => (
          <li
            key={p.id}
            onDragOver={(e) => onDragOver(e, p.id)}
            onDrop={(e) => e.preventDefault()}
            className={`flex items-center gap-3 px-3 py-3 transition-colors ${
              dragId === p.id ? "bg-paper opacity-60" : "hover:bg-paper"
            }`}
          >
            <span
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={persistOrder}
              aria-label={`Mover ${p.name}`}
              className="cursor-grab p-1 text-text-dark/25 hover:text-text-dark/60 active:cursor-grabbing"
            >
              <GripVertical size={18} />
            </span>

            <Link
              href={`/admin/products/${p.id}`}
              className="flex min-w-0 flex-1 items-center gap-4"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-studio">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-text-dark/30">
                    <ImageOff size={18} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{p.name}</span>
                  {!p.active && (
                    <span className="rounded-full bg-text-dark/10 px-2 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-text-dark/50">
                      Oculto
                    </span>
                  )}
                  {!p.image_url && (
                    <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-warn">
                      Sin foto
                    </span>
                  )}
                  {p.badge && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-accent">
                      {p.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-dark/50">
                  {p.brand ? `${p.brand} · ` : ""}
                  {p.category} · {p.slug}
                </span>
              </div>

              <span className="shrink-0 font-bold text-accent">
                {formatCOP(p.price)}
              </span>
              <Pencil size={16} className="shrink-0 text-text-dark/35" />
            </Link>
          </li>
        ))}

        {items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-text-dark/50">
            Aún no hay productos. Crea el primero con “Nuevo producto”.
          </li>
        )}
      </ul>
    </div>
  );
}
