/**
 * Tipos + configuración estática + datos de respaldo (fallback).
 * Los datos "en vivo" se leen de Supabase en `data.ts`; si la BD falla o está
 * vacía, la tienda cae a estos mocks y nunca se rompe.
 */

export type Category =
  | "INTEGRAL"
  | "ABATIBLE"
  | "ABIERTO"
  | "MULTIPROPOSITO";

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  compareAt?: number | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  imageUrl?: string | null;
  gallery: string[];
  description?: string | null;
  specs: Spec[];
  /** Tallas disponibles. Las que no estén aquí se muestran tachadas y no seleccionables. */
  sizes: Size[];
}

export interface Review {
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

/**
 * Tipos de casco que maneja la tienda.
 *
 * El `id` es lo que se guarda en la base de datos; el `label` es lo que ve
 * el cliente. Multipropósito ya queda definido aunque todavía no se venda:
 * la portada solo muestra las categorías que tienen productos publicados,
 * así que aparecerá sola cuando cargues el primero.
 */
export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  {
    id: "INTEGRAL",
    label: "Integral",
    blurb: "Máxima protección, cara cerrada.",
  },
  {
    id: "ABATIBLE",
    label: "Abatible",
    blurb: "Mentonera que se levanta, versátil.",
  },
  {
    id: "ABIERTO",
    label: "Abierto",
    blurb: "Ligereza urbana, cara descubierta.",
  },
  {
    id: "MULTIPROPOSITO",
    label: "Multipropósito",
    blurb: "Ciudad y trocha en un solo casco.",
  },
];

/** Nombre legible de una categoría. Cae al código si llega algo inesperado. */
export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

/** Etiquetas por defecto para las vistas de la galería cuando no hay fotos. */
export const GALLERY_VIEW_LABELS = [
  "Vista principal",
  "Lateral",
  "Frontal",
  "Posterior",
];

const SHPRO_SPECS: Spec[] = [
  { label: "Tipo", value: "Jet / cara abierta" },
  { label: "Casco exterior", value: "Policarbonato de alta densidad" },
  { label: "Certificación", value: "ECE 22.06 / DOT" },
  { label: "Peso", value: "1.150 g (± 50 g)" },
  { label: "Visor", value: "Antirrayas, con visera solar interna" },
  { label: "Forro", value: "Extraíble y lavable, antibacterial" },
  { label: "Ventilación", value: "2 entradas frontales + extractor trasero" },
  { label: "Cierre", value: "Micrométrico de acero inoxidable" },
];

/** Fallback: se usa solo si Supabase no responde o está vacío. */
export const MOCK_PRODUCTS: Product[] = [
  { slug: "shpro-609", name: "SHPRO-609 Jet", brand: "ROVEX", category: "ABIERTO", price: 489000, compareAt: 589000, rating: 4.8, reviewCount: 126, badge: "MÁS VENDIDO", gallery: [], description: "Casco jet de cara abierta que combina ligereza urbana con protección certificada.", specs: SHPRO_SPECS, sizes: [...SIZES] },
  { slug: "aero-gt-carbon", name: "Aero GT Carbon", brand: "ROVEX", category: "INTEGRAL", price: 1290000, rating: 4.9, reviewCount: 87, badge: "CARBONO", gallery: [], specs: [], sizes: [...SIZES] },
  { slug: "urban-flip-pro", name: "Urban Flip Pro", brand: "ROVEX", category: "ABATIBLE", price: 749000, compareAt: 829000, rating: 4.6, reviewCount: 54, gallery: [], specs: [], sizes: [...SIZES] },
  { slug: "integral-rs-7", name: "Integral RS-7", brand: "ROVEX", category: "INTEGRAL", price: 899000, rating: 4.7, reviewCount: 63, gallery: [], specs: [], sizes: [...SIZES] },
  { slug: "trail-x-adventure", name: "Trail-X Adventure", brand: "ROVEX", category: "MULTIPROPOSITO", price: 969000, rating: 4.5, reviewCount: 41, badge: "NUEVO", gallery: [], specs: [], sizes: [...SIZES] },
  { slug: "city-jet-lite", name: "City Jet Lite", brand: "ROVEX", category: "ABIERTO", price: 329000, rating: 4.4, reviewCount: 98, gallery: [], specs: [], sizes: [...SIZES] },
];

export const MOCK_REVIEWS: Review[] = [
  { author: "Andrés M.", city: "Medellín", rating: 5, title: "Cómodo y bien ventilado", body: "Lo uso a diario en la ciudad. Muy liviano y la visera solar es una maravilla al mediodía. La relación precio-calidad es difícil de superar.", date: "2026-05-12" },
  { author: "Laura G.", city: "Bogotá", rating: 5, title: "Se siente premium de verdad", body: "Los acabados y el forro se sienten de gama alta. El cierre micrométrico es súper práctico con guantes.", date: "2026-04-28" },
  { author: "Julián R.", city: "Cali", rating: 4, title: "Muy bueno, talla algo justa", body: "Excelente casco. Recomiendo pedir una talla más si tienes cabeza ancha. El envío llegó en dos días.", date: "2026-06-03" },
];
