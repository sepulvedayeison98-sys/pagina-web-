/**
 * URL pública del sitio, para robots.txt, sitemap.xml y metadatos.
 *
 * Se resuelve sola en Vercel a través de VERCEL_PROJECT_PRODUCTION_URL, que
 * siempre apunta al dominio de producción. Gracias a eso, renombrar el
 * proyecto (o conectar un dominio propio) no obliga a tocar el código.
 * NEXT_PUBLIC_SITE_URL la sobreescribe si algún día se define a mano.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
