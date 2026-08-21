"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Trash2, X, Plus, Loader2, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIZES, type Spec } from "@/lib/products";
import { BRANDS, specsForBrand, isUntouchedTemplate } from "@/lib/brands";
import { VISORES, ACABADOS } from "@/lib/variants";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  model: string | null;
  variant: string | null;
  visor: string | null;
  spoiler: string | null;
  category: string;
  price: number;
  compare_at: number | null;
  rating: number;
  review_count: number;
  badge: string | null;
  image_url: string | null;
  gallery: string[];
  description: string | null;
  specs: Spec[];
  sizes: string[];
  active: boolean;
  sort_order: number;
}

const CATEGORIES = ["INTEGRAL", "JET", "MODULAR", "OFFROAD"];

const input =
  "w-full rounded-lg border border-text-dark/20 px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const labelCls = "flex flex-col gap-1.5 text-sm";
const labelText = "font-medium text-text-dark/70";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ initial }: { initial?: ProductRow }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? "JET");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [compareAt, setCompareAt] = useState(
    initial?.compare_at != null ? String(initial.compare_at) : ""
  );
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [rating, setRating] = useState(String(initial?.rating ?? "4.5"));
  const [reviewCount, setReviewCount] = useState(
    String(initial?.review_count ?? "0")
  );
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? "0"));
  const [active, setActive] = useState(initial?.active ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initial?.image_url ?? null
  );
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [variant, setVariant] = useState(initial?.variant ?? "");
  const [visor, setVisor] = useState(initial?.visor ?? "");
  const [spoiler, setSpoiler] = useState(initial?.spoiler ?? "");
  const [specs, setSpecs] = useState<Spec[]>(initial?.specs ?? []);

  /**
   * Al elegir marca se carga su plantilla, pero solo si no hay nada escrito
   * todavía (o si lo que hay es otra plantilla sin tocar). Así cambiar de
   * marca por error nunca borra datos ya redactados; para esos casos queda
   * el botón "Usar plantilla".
   */
  function handleBrandChange(next: string) {
    setBrand(next);
    if (isUntouchedTemplate(specs)) setSpecs(specsForBrand(next));
  }
  const [sizes, setSizes] = useState<string[]>(
    initial?.sizes ?? [...SIZES]
  );

  function toggleSize(s: string) {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const base = slug || slugify(name) || "producto";
    const path = `${base}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(path).data
      .publicUrl;
  }

  async function handleMainUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setImageUrl(await uploadFile(file));
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setGallery((g) => [...g, ...urls]);
    } catch {
      setError("No se pudieron subir algunas imágenes.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalSlug = slug || slugify(name);
    if (!name || !finalSlug || !price) {
      setError("Nombre, slug y precio son obligatorios.");
      return;
    }
    setSaving(true);
    const payload = {
      slug: finalSlug,
      name,
      brand: brand || null,
      model: model.trim() || null,
      variant: variant.trim() || null,
      visor: visor || null,
      spoiler: spoiler.trim() || null,
      category,
      price: Number(price),
      compare_at: compareAt ? Number(compareAt) : null,
      badge: badge || null,
      rating: Number(rating) || 0,
      review_count: Number(reviewCount) || 0,
      sort_order: Number(sortOrder) || 0,
      active,
      description: description || null,
      image_url: imageUrl,
      gallery,
      specs: specs.filter((s) => s.label || s.value),
      // Guardar en el orden canónico de SIZES (XS→XL).
      sizes: SIZES.filter((s) => sizes.includes(s)),
    };

    const { error } = isEdit
      ? await supabase.from("products").update(payload).eq("id", initial!.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) {
      setError(
        error.message.includes("duplicate")
          ? "Ya existe un producto con ese slug."
          : "No se pudo guardar. " + error.message
      );
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  /**
   * Crea una copia del producto con los datos que hay ahora en el formulario
   * y abre la copia para editarla. Nace oculta, para que no aparezca en la
   * tienda a medio llenar. Sirve para cargar variantes de un mismo modelo
   * sin repetir specs, tallas y precio.
   */
  async function handleDuplicate() {
    if (!initial) return;
    setSaving(true);
    setError(null);

    const base = slug || slugify(name) || "producto";
    const copySlug = `${base}-copia-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        slug: copySlug,
        name: `${name} (copia)`,
        brand: brand || null,
        model: model.trim() || null,
        variant: variant.trim() || null,
        visor: visor || null,
        spoiler: spoiler.trim() || null,
        category,
        price: Number(price) || 0,
        compare_at: compareAt ? Number(compareAt) : null,
        badge: badge || null,
        rating: Number(rating) || 0,
        review_count: 0,
        sort_order: Number(sortOrder) || 0,
        active: false,
        description: description || null,
        image_url: imageUrl,
        gallery,
        specs: specs.filter((s) => s.label || s.value),
        sizes: SIZES.filter((s) => sizes.includes(s)),
      })
      .select("id")
      .single();

    setSaving(false);
    if (error || !data) {
      setError("No se pudo duplicar. " + (error?.message ?? ""));
      return;
    }
    router.push(`/admin/products/${data.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`¿Eliminar "${initial.name}"? Esta acción no se puede deshacer.`))
      return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", initial.id);
    setSaving(false);
    if (error) {
      setError("No se pudo eliminar.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Columna izquierda: datos */}
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-text-dark/10 bg-white p-5 space-y-4">
          <label className={labelCls}>
            <span className={labelText}>Nombre</span>
            <input
              className={input}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit && !slug) setSlug(slugify(e.target.value));
              }}
              placeholder="Casco Aero GT Carbon"
            />
          </label>

          <label className={labelCls}>
            <span className={labelText}>Slug (URL)</span>
            <input
              className={input}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="aero-gt-carbon"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              <span className={labelText}>Marca</span>
              <select
                className={input}
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="">— Elegir marca —</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelCls}>
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
            <label className={labelCls}>
              <span className={labelText}>Distintivo (badge)</span>
              <input
                className={input}
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="NUEVO, CARBONO…"
              />
            </label>
          </div>

          {/* Variante: qué distingue esta referencia de otras del mismo modelo */}
          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              <span className={labelText}>Modelo</span>
              <input
                className={input}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="501"
              />
            </label>
            <label className={labelCls}>
              <span className={labelText}>Acabado / diseño</span>
              <input
                className={input}
                list="acabados-prod"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="SOLID, gráfico…"
              />
              <datalist id="acabados-prod">
                {ACABADOS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
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
            <label className={labelCls}>
              <span className={labelText}>Spoiler (color)</span>
              <input
                className={input}
                value={spoiler}
                onChange={(e) => setSpoiler(e.target.value)}
                placeholder="Rojo, negro…"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              <span className={labelText}>Precio (COP)</span>
              <input
                type="number"
                className={input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="489000"
              />
            </label>
            <label className={labelCls}>
              <span className={labelText}>Precio anterior (opcional)</span>
              <input
                type="number"
                className={input}
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                placeholder="589000"
              />
            </label>
          </div>

          <label className={labelCls}>
            <span className={labelText}>Descripción</span>
            <textarea
              className={`${input} min-h-24 resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el producto…"
            />
          </label>
        </div>

        {/* Especificaciones */}
        <div className="rounded-2xl border border-text-dark/10 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Especificaciones</h3>
            <div className="flex items-center gap-4">
              {brand && (
                <button
                  type="button"
                  onClick={() => setSpecs(specsForBrand(brand))}
                  className="text-sm text-text-dark/55 hover:text-accent hover:underline"
                  title={`Reemplaza las filas por la plantilla de ${brand}`}
                >
                  Usar plantilla {brand}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])}
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <Plus size={14} /> Añadir
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={input}
                  value={s.label}
                  onChange={(e) =>
                    setSpecs((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Peso"
                />
                <input
                  className={input}
                  value={s.value}
                  onChange={(e) =>
                    setSpecs((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, value: e.target.value } : x
                      )
                    )
                  }
                  placeholder="1.150 g"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSpecs((arr) => arr.filter((_, j) => j !== i))
                  }
                  className="shrink-0 rounded-lg px-2 text-text-dark/40 hover:text-danger"
                  aria-label="Quitar"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {specs.length === 0 && (
              <p className="text-sm text-text-dark/45">
                Sin especificaciones. Añade filas como “Peso · 1.150 g”.
              </p>
            )}
          </div>
        </div>

        {/* Tallas disponibles */}
        <div className="rounded-2xl border border-text-dark/10 bg-white p-5">
          <h3 className="mb-1 font-semibold">Tallas disponibles</h3>
          <p className="mb-3 text-sm text-text-dark/50">
            Marca las tallas con stock. Las que desmarques aparecerán tachadas
            y no se podrán seleccionar en la ficha del producto.
          </p>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => {
              const on = sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  aria-pressed={on}
                  className={`h-11 w-14 rounded-xl border text-sm font-semibold transition-colors ${
                    on
                      ? "border-accent bg-accent text-white"
                      : "border-text-dark/20 text-text-dark/40 line-through hover:border-text-dark/40"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {sizes.length === 0 && (
            <p className="mt-3 text-sm text-warn">
              Sin tallas marcadas: el producto aparecerá como agotado.
            </p>
          )}
        </div>
      </div>

      {/* Columna derecha: fotos + estado */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-text-dark/10 bg-white p-5">
          <h3 className="mb-3 font-semibold">Foto principal</h3>
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-studio">
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt="Vista previa"
                  fill
                  sizes="300px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-white hover:bg-ink"
                  aria-label="Quitar foto"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-text-dark/40">
                Sin foto
              </span>
            )}
          </div>
          <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-text-dark/20 px-4 py-2.5 text-sm font-medium hover:border-accent hover:text-accent">
            <Upload size={15} /> Subir foto
            <input
              type="file"
              accept="image/*"
              onChange={handleMainUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-text-dark/10 bg-white p-5">
          <h3 className="mb-3 font-semibold">Galería</h3>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {gallery.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-studio"
              >
                <Image
                  src={url}
                  alt={`Galería ${i + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setGallery((g) => g.filter((_, j) => j !== i))
                  }
                  className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white hover:bg-ink"
                  aria-label="Quitar"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-text-dark/20 px-4 py-2.5 text-sm font-medium hover:border-accent hover:text-accent">
            <Upload size={15} /> Añadir fotos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-text-dark/10 bg-white p-5 space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span className={labelText}>Visible en la tienda</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              <span className={labelText}>Estrellas</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className={input}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </label>
            <label className={labelCls}>
              <span className={labelText}>Nº reseñas</span>
              <input
                type="number"
                className={input}
                value={reviewCount}
                onChange={(e) => setReviewCount(e.target.value)}
              />
            </label>
          </div>
          <label className={labelCls}>
            <span className={labelText}>Orden (menor = primero)</span>
            <input
              type="number"
              className={input}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="lg:col-span-3 flex flex-wrap items-center gap-3">
        {error && <p className="text-sm text-warn">{error}</p>}
        {uploading && (
          <span className="inline-flex items-center gap-1 text-sm text-text-dark/50">
            <Loader2 size={14} className="animate-spin" /> Subiendo…
          </span>
        )}
        <div className="ml-auto flex gap-3">
          {isEdit && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={saving}
                title="Crea una copia oculta con estos mismos datos"
                className="inline-flex items-center gap-1 rounded-full border border-text-dark/20 px-5 py-2.5 text-sm font-semibold text-text-dark/70 hover:border-text-dark/50 hover:text-text-dark disabled:opacity-60"
              >
                <Copy size={15} /> Duplicar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-full border border-danger/30 px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
