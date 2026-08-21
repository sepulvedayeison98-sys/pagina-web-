"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIZES } from "@/lib/products";
import { BRANDS, specsForBrand } from "@/lib/brands";
import { VISORES, ACABADOS, suggestName } from "@/lib/variants";

const CATEGORIES = ["INTEGRAL", "JET", "MODULAR", "OFFROAD"];
const input =
  "w-full rounded-lg border border-text-dark/20 px-3 py-2 text-sm focus:border-accent focus:outline-none";
const labelText = "font-medium text-text-dark/70";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Alta rápida de una referencia desde Inventario.
 *
 * Al elegir la marca se cargan sus especificaciones por defecto, igual que
 * en la ficha de producto. La referencia nace OCULTA en la tienda: primero
 * se carga el stock y la foto, y se publica después desde Productos.
 *
 * Si la marca no está en la lista se puede escribir a mano, para no quedar
 * atado a un catálogo fijo de marcas.
 */
export default function NewReferenceForm() {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [otherBrand, setOtherBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("SOLID");
  const [visor, setVisor] = useState("");
  const [spoiler, setSpoiler] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [category, setCategory] = useState("INTEGRAL");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState<string[]>([...SIZES]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const marcaFinal = brand === "__otra" ? otherBrand.trim() : brand;
  const nombreSugerido = suggestName(marcaFinal, { model, variant });
  const nombreFinal = nameTouched && name.trim() ? name.trim() : nombreSugerido;

  function reset() {
    setBrand("");
    setOtherBrand("");
    setModel("");
    setVariant("SOLID");
    setVisor("");
    setSpoiler("");
    setName("");
    setNameTouched(false);
    setCategory("INTEGRAL");
    setPrice("");
    setSizes([...SIZES]);
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreFinal || !price) {
      setError("Falta el modelo (o el nombre) y el precio.");
      return;
    }
    setSaving(true);
    setError(null);

    // El slug incluye visor y spoiler: dos variantes del mismo modelo no
    // pueden compartir URL.
    const base =
      slugify([nombreFinal, visor, spoiler].filter(Boolean).join(" ")) ||
      slugify(nombreFinal);

    const { error } = await supabase.from("products").insert({
      slug: base,
      name: nombreFinal,
      brand: marcaFinal || null,
      model: model.trim() || null,
      variant: variant.trim() || null,
      visor: visor || null,
      spoiler: spoiler.trim() || null,
      category,
      price: Number(price) || 0,
      sizes: SIZES.filter((s) => sizes.includes(s)),
      // La plantilla de la marca ya viene rellena; si la marca es nueva
      // queda vacía y se completa desde la ficha del producto.
      specs: specsForBrand(marcaFinal),
      active: false,
    });

    setSaving(false);
    if (error) {
      setError(
        error.message.includes("duplicate")
          ? "Ya existe una referencia con ese nombre y marca."
          : "No se pudo crear. " + error.message
      );
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-text-dark/20 px-4 py-2 text-sm font-medium text-text-dark/70 transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={15} /> Nueva referencia
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="space-y-4 rounded-2xl border border-accent/30 bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Nueva referencia</h3>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          aria-label="Cerrar"
          className="text-text-dark/40 hover:text-text-dark"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Marca</span>
          <select
            className={input}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">— Sin marca —</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value="__otra">Otra marca…</option>
          </select>
        </label>

        {brand === "__otra" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Nombre de la marca</span>
            <input
              className={input}
              value={otherBrand}
              onChange={(e) => setOtherBrand(e.target.value)}
              placeholder="Ej. MT Helmets"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelText}>Categoría</span>
            <select
              className={input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {brand === "__otra" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Categoría</span>
          <select
            className={input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Modelo</span>
          <input
            className={input}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ej. 501"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Acabado / diseño</span>
          <input
            className={input}
            list="acabados"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            placeholder="SOLID, Venom, gráfico…"
          />
          <datalist id="acabados">
            {ACABADOS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>
      </div>

      {/* Lo que diferencia una variante de otra dentro del mismo modelo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Visor</span>
          <select
            className={input}
            value={visor}
            onChange={(e) => setVisor(e.target.value)}
          >
            <option value="">— Sin especificar —</option>
            {VISORES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Spoiler (color)</span>
          <input
            className={input}
            value={spoiler}
            onChange={(e) => setSpoiler(e.target.value)}
            placeholder="Rojo, negro… (vacío si no trae)"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>
            Nombre de la referencia{" "}
            <span className="font-normal text-text-dark/40">(automático)</span>
          </span>
          <input
            className={input}
            value={nameTouched ? name : nombreSugerido}
            onChange={(e) => {
              setNameTouched(true);
              setName(e.target.value);
            }}
            placeholder="ICH 501 SOLID"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelText}>Precio (COP)</span>
          <input
            type="number"
            className={input}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="489000"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className={labelText}>Tallas que maneja</span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const on = sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setSizes((prev) =>
                    prev.includes(s)
                      ? prev.filter((x) => x !== s)
                      : [...prev, s]
                  )
                }
                aria-pressed={on}
                className={`h-9 w-12 rounded-lg border text-sm font-semibold transition-colors ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-text-dark/20 text-text-dark/40 line-through"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {marcaFinal && (
        <p className="rounded-lg bg-paper px-3 py-2 text-xs text-text-dark/60">
          Se cargarán las especificaciones por defecto de{" "}
          <strong>{marcaFinal}</strong>
          {specsForBrand(marcaFinal).length > 0
            ? ` (${specsForBrand(marcaFinal).length} campos).`
            : ". Como es una marca nueva, quedarán en blanco para llenarlas desde Productos."}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">
          {error ? (
            <span className="text-warn">{error}</span>
          ) : (
            <span className="text-text-dark/45">
              Se crea oculta: publícala desde Productos cuando tenga foto.
            </span>
          )}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          Crear
        </button>
      </div>
    </form>
  );
}
