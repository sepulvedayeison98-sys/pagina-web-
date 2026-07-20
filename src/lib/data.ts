import { createClient } from "@/lib/supabase/server";
import {
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
  type Category,
  type Product,
  type Review,
  type Spec,
} from "./products";

function rowToProduct(r: any): Product {
  return {
    slug: r.slug,
    name: r.name,
    brand: r.brand ?? "VELTOR",
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
