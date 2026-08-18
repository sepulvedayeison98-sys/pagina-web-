import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** El panel de administración no debe indexarse; el resto de la tienda sí. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
