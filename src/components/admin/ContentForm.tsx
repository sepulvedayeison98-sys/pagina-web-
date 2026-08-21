"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CONTENT_GROUPS,
  CONTENT_DEFAULTS,
  type SiteContent,
} from "@/lib/content";

const input =
  "w-full rounded-lg border border-text-dark/20 px-3 py-2.5 text-sm focus:border-accent focus:outline-none";

/**
 * Editor de los textos de la tienda. Se genera solo a partir de
 * CONTENT_GROUPS, así que añadir un campo editable no requiere tocar
 * este componente.
 *
 * Guarda con upsert sobre `site_content` y solo envía lo que cambió.
 */
export default function ContentForm({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const supabase = createClient();

  const [values, setValues] = useState<SiteContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string>(CONTENT_GROUPS[0].id);

  const dirtyKeys = useMemo(
    () => Object.keys(values).filter((k) => values[k] !== initial[k]),
    [values, initial]
  );

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (dirtyKeys.length === 0) return;
    setSaving(true);
    setError(null);

    const rows = dirtyKeys.map((key) => ({
      key,
      value: values[key] ?? "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("site_content")
      .upsert(rows, { onConflict: "key" });

    setSaving(false);
    if (error) {
      setError("No se pudo guardar. " + error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4 pb-28">
      {CONTENT_GROUPS.map((group) => {
        const open = openGroup === group.id;
        const changed = group.fields.filter(
          (f) => values[f.key] !== initial[f.key]
        ).length;

        return (
          <section
            key={group.id}
            className="overflow-hidden rounded-2xl border border-text-dark/10 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenGroup(open ? "" : group.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper"
              aria-expanded={open}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{group.title}</span>
                  {changed > 0 && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-bold text-accent">
                      {changed} sin guardar
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-text-dark/55">
                  {group.description}
                </span>
              </span>
              <span className="shrink-0 text-text-dark/40">
                {open ? "−" : "+"}
              </span>
            </button>

            {open && (
              <div className="space-y-4 border-t border-text-dark/10 px-5 py-5">
                {group.fields.map((f) => {
                  const value = values[f.key] ?? "";
                  const isDefault = value === CONTENT_DEFAULTS[f.key];
                  return (
                    <label key={f.key} className="flex flex-col gap-1.5 text-sm">
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium text-text-dark/70">
                          {f.label}
                        </span>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => set(f.key, CONTENT_DEFAULTS[f.key])}
                            className="inline-flex items-center gap-1 text-xs text-text-dark/45 hover:text-accent"
                            title="Volver al texto original"
                          >
                            <RotateCcw size={12} /> Restaurar
                          </button>
                        )}
                      </span>

                      {f.multiline ? (
                        <textarea
                          className={`${input} min-h-24 resize-y`}
                          value={value}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      ) : (
                        <input
                          className={input}
                          value={value}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      )}

                      {f.help && (
                        <span className="text-xs text-text-dark/45">
                          {f.help}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* Barra fija de guardado */}
      <div className="fixed inset-x-0 bottom-0 border-t border-text-dark/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <p className="text-sm text-text-dark/60">
            {error ? (
              <span className="text-warn">{error}</span>
            ) : dirtyKeys.length > 0 ? (
              `${dirtyKeys.length} cambio${dirtyKeys.length > 1 ? "s" : ""} sin guardar`
            ) : saved ? (
              <span className="inline-flex items-center gap-1 text-accent">
                <Check size={15} /> Guardado. Ya se ve en la tienda.
              </span>
            ) : (
              "Todo guardado."
            )}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || dirtyKeys.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
