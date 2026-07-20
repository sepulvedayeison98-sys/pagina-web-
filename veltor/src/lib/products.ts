/**
 * Datos de productos y reseñas (MOCK).
 * Reemplazar por una API/CMS cuando exista backend.
 */

export type Category = "INTEGRAL" | "JET" | "MODULAR" | "OFFROAD";

export interface Product {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  /** precio anterior tachado, opcional */
  compareAt?: number;
  /** ruta de imagen en /public; si falta se muestra placeholder */
  image?: string;
  rating: number;
  reviewCount: number;
  badge?: string;
}

export interface Review {
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: "INTEGRAL", label: "Integral", blurb: "Máxima protección, cara cerrada." },
  { id: "JET", label: "Jet", blurb: "Ligereza urbana, cara abierta." },
  { id: "MODULAR", label: "Modular", blurb: "Mentonera abatible, versátil." },
  { id: "OFFROAD", label: "Off-Road", blurb: "Aventura y trocha." },
];

export const PRODUCTS: Product[] = [
  {
    slug: "shpro-609",
    name: "SHPRO-609 Jet",
    brand: "VELTOR",
    category: "JET",
    price: 489000,
    compareAt: 589000,
    rating: 4.8,
    reviewCount: 126,
    badge: "MÁS VENDIDO",
  },
  {
    slug: "aero-gt-carbon",
    name: "Aero GT Carbon",
    brand: "VELTOR",
    category: "INTEGRAL",
    price: 1290000,
    rating: 4.9,
    reviewCount: 87,
    badge: "CARBONO",
  },
  {
    slug: "urban-flip-pro",
    name: "Urban Flip Pro",
    brand: "VELTOR",
    category: "MODULAR",
    price: 749000,
    compareAt: 829000,
    rating: 4.6,
    reviewCount: 54,
  },
  {
    slug: "integral-rs-7",
    name: "Integral RS-7",
    brand: "VELTOR",
    category: "INTEGRAL",
    price: 899000,
    rating: 4.7,
    reviewCount: 63,
  },
  {
    slug: "trail-x-adventure",
    name: "Trail-X Adventure",
    brand: "VELTOR",
    category: "OFFROAD",
    price: 969000,
    rating: 4.5,
    reviewCount: 41,
    badge: "NUEVO",
  },
  {
    slug: "city-jet-lite",
    name: "City Jet Lite",
    brand: "VELTOR",
    category: "JET",
    price: 329000,
    rating: 4.4,
    reviewCount: 98,
  },
];

/** Producto destacado de la ficha (2a). */
export const FEATURED = PRODUCTS[0];

/** Galería de la ficha SHPRO-609. Etiquetas de las vistas (placeholder). */
export const SHPRO_609_GALLERY: string[] = [
  "Vista principal",
  "Lateral",
  "Frontal",
  "Posterior",
];

export const SHPRO_609_SPECS: { label: string; value: string }[] = [
  { label: "Tipo", value: "Jet / cara abierta" },
  { label: "Casco exterior", value: "Policarbonato de alta densidad" },
  { label: "Certificación", value: "ECE 22.06 / DOT" },
  { label: "Peso", value: "1.150 g (± 50 g)" },
  { label: "Visor", value: "Antirrayas, con visera solar interna" },
  { label: "Forro", value: "Extraíble y lavable, antibacterial" },
  { label: "Ventilación", value: "2 entradas frontales + extractor trasero" },
  { label: "Cierre", value: "Micrométrico de acero inoxidable" },
];

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

export const REVIEWS: Review[] = [
  {
    author: "Andrés M.",
    city: "Medellín",
    rating: 5,
    title: "Cómodo y bien ventilado",
    body:
      "Lo uso a diario en la ciudad. Muy liviano y la visera solar es una maravilla al mediodía. La relación precio-calidad es difícil de superar.",
    date: "2026-05-12",
  },
  {
    author: "Laura G.",
    city: "Bogotá",
    rating: 5,
    title: "Se siente premium de verdad",
    body:
      "Los acabados y el forro se sienten de gama alta. El cierre micrométrico es súper práctico con guantes.",
    date: "2026-04-28",
  },
  {
    author: "Julián R.",
    city: "Cali",
    rating: 4,
    title: "Muy bueno, talla algo justa",
    body:
      "Excelente casco. Recomiendo pedir una talla más si tienes cabeza ancha. El envío llegó en dos días.",
    date: "2026-06-03",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
