"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Star, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ReviewRow {
  id: string;
  author: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  review_date: string;
}

const input =
  "w-full rounded-lg border border-text-dark/20 px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const labelText = "font-medium text-text-dark/70";

/** Fila vacía para el formulario de alta. */
const EMPTY = {
  author: "",
  city: "",
  rating: 5,
  title: "",
  body: "",
  review_date: new Date().toISOString().slice(0, 10),
};

/** Selector de estrellas clicable. */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={
              n <= value
                ? "fill-accent text-accent"
                : "fill-transparent text-text-dark/25"
            }
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Alta y baja de reseñas de la tienda. Se muestran en la portada y en la
 * pestaña "Reseñas" de cada ficha de producto.
 *
 * Pensado para el flujo real del negocio: un cliente escribe algo bueno por
 * WhatsApp y aquí se publica en un minuto.
 */
export default function ReviewsManager({ initial }: { initial: ReviewRow[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [draft, setDraft] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.author.trim() || !draft.body.trim()) {
      setError("El nombre y el comentario son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("reviews").insert({
      author: draft.author.trim(),
      city: draft.city.trim() || null,
      rating: draft.rating,
      title: draft.title.trim() || null,
      body: draft.body.trim(),
      review_date: draft.review_date,
    });

    setSaving(false);
    if (error) {
      setError("No se pudo publicar. " + error.message);
      return;
    }
    setDraft({ ...EMPTY });
    setSaved(true);
    router.refresh();
  }

  async function handleDelete(r: ReviewRow) {
    if (!confirm(`¿Eliminar la reseña de ${r.author}?`)) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) {
      setError("No se pudo eliminar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Alta */}
      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-2xl border border-text-dark/10 bg-white p-5"
      >
        <h2 className="font-semibold">Publicar una reseña</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Nombre del cliente</span>
            <input
              className={input}
              value={draft.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Andrés M."
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Ciudad</span>
            <input
              className={input}
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Medellín"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Título (opcional)</span>
          <input
            className={input}
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Cómodo y bien ventilado"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Comentario</span>
          <textarea
            className={`${input} min-h-24 resize-y`}
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="Lo que el cliente escribió sobre el casco…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Calificación</span>
            <StarPicker
              value={draft.rating}
              onChange={(n) => set("rating", n)}
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Fecha</span>
            <input
              type="date"
              className={input}
              value={draft.review_date}
              onChange={(e) => set("review_date", e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-sm">
            {error ? (
              <span className="text-warn">{error}</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1 text-accent">
                <Check size={15} /> Publicada.
              </span>
            ) : null}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Publicar
          </button>
        </div>
      </form>

      {/* Listado */}
      <div>
        <h2 className="mb-3 font-semibold">
          Publicadas{" "}
          <span className="font-normal text-text-dark/50">
            ({initial.length})
          </span>
        </h2>

        <ul className="divide-y divide-text-dark/10 overflow-hidden rounded-2xl border border-text-dark/10 bg-white">
          {initial.map((r) => (
            <li key={r.id} className="flex gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.author}</span>
                  {r.city && (
                    <span className="text-xs text-text-dark/50">{r.city}</span>
                  )}
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={13}
                        className={
                          n <= r.rating
                            ? "fill-accent text-accent"
                            : "fill-transparent text-text-dark/20"
                        }
                      />
                    ))}
                  </span>
                  <span className="text-xs text-text-dark/40">
                    {r.review_date}
                  </span>
                </div>
                {r.title && (
                  <p className="mt-1 text-sm font-medium">{r.title}</p>
                )}
                <p className="mt-0.5 text-sm text-text-dark/65">{r.body}</p>
              </div>

              <button
                onClick={() => handleDelete(r)}
                aria-label={`Eliminar reseña de ${r.author}`}
                className="h-fit shrink-0 text-text-dark/30 transition-colors hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}

          {initial.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-text-dark/50">
              Aún no hay reseñas. Publica la primera con el formulario de
              arriba.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
