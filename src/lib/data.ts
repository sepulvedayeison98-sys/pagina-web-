import { createClient } from "@/lib/supabase/server";
import { CONTENT_DEFAULTS, type SiteContent } from "./content";
import {
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
  SIZES,
  type Category,
  type Product,
  type Review,
  type Size,
  type Spec,
} from "./products";

function rowToProduct(r: any): Product {
  return {
    slug: r.slug,
    name: r.name,
    brand: r.brand ?? "ROVEX",
    category: r.category as Category,
    price: r.price,
    compareAt: r.compare_at,
    rating: Number(r.rating) || 0,
    reviewCount: r.review_count ?? 0,
    badge: r.badge,
    imageUrl: r.image_url,
    gallery: Array.isArray(r.gallery) ? r.gallery : [],
    description: r.description,
    specs: Array.isArray(r.specs) ? (r.specs as Spec[]) : [],
    // Sin tallas definidas → todas disponibles (compatibilidad hacia atrás).
    sizes:
      Array.isArray(r.sizes) && r.sizes.length
        ? (r.sizes.filter((s: string) =>
            (SIZES as readonly string[]).includes(s)
          ) as Size[])
        : [...SIZES],
  };
}

function rowToReview(r: any): Review {
  return {
    author: r.author,
    city: r.city ?? "",
    rating: r.rating,
    title: r.title ?? "",
    body: r.body,
    date: r.review_date ?? "",
  };
}

/** Todos los productos activos (ordenados). Cae al mock si la BD falla/está vacía. */
export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return MOCK_PRODUCTS;
    return data.map(rowToProduct);
  } catch {
    return MOCK_PRODUCTS;
  }
}

/**
 * Productos activos de una categoría. Filtra en la base de datos en vez de
 * traer todo el catálogo, para que siga siendo rápido cuando crezca.
 */
export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .eq("category", category)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) {
      return MOCK_PRODUCTS.filter((p) => p.category === category);
    }
    return data.map(rowToProduct);
  } catch {
    return MOCK_PRODUCTS.filter((p) => p.category === category);
  }
}

/** Cuántos productos activos hay por categoría, para pintar los contadores. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const productos = await getProducts();
  return productos.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

/** Un producto por slug. */
export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) {
      return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
    }
    return rowToProduct(data);
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

/**
 * Textos editables de la tienda. Combina lo guardado en `site_content` sobre
 * los valores por defecto del código, de modo que cualquier clave que falte
 * (o si la base de datos no responde) siga mostrando su texto original.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key,value");
    if (error || !data) return { ...CONTENT_DEFAULTS };
    const saved = Object.fromEntries(
      data
        .filter((r) => typeof r.value === "string" && r.value.trim() !== "")
        .map((r) => [r.key as string, r.value as string])
    );
    return { ...CONTENT_DEFAULTS, ...saved };
  } catch {
    return { ...CONTENT_DEFAULTS };
  }
}

/** Reseñas generales de la home (sin producto asociado). */
export async function getReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .is("product_id", null)
      .order("review_date", { ascending: false })
      .limit(6);
    if (error || !data || data.length === 0) return MOCK_REVIEWS;
    return data.map(rowToReview);
  } catch {
    return MOCK_REVIEWS;
  }
}
