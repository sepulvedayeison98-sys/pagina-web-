import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/products";
import { siteUrl } from "@/lib/site";

/** Portada, guía de tallas y una entrada por producto activo del catálogo. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getProducts();

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/guia-de-tallas`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    // Solo las categorías que tienen algo publicado: no vale la pena
    // ofrecerle a Google una página vacía.
    ...CATEGORIES.filter((c) =>
      products.some((p) => p.category === c.id)
    ).map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
