import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
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
    ...products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
