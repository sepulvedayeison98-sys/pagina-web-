import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import Cta from "@/components/Cta";
import {
  CATEGORIES,
  categoryBySlug,
  categoryHref,
} from "@/lib/products";
import { getProductsByCategory, getCategoryCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Una página por cada tipo de casco, para que Google las indexe. */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) return { title: "Categoría no encontrada · ROVEX" };

  const title = `Cascos ${cat.label} · ROVEX`;
  const description = `${cat.blurb} Cascos ${cat.label.toLowerCase()} certificados con envío a toda Colombia.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "ROVEX",
      title,
      description,
      locale: "es_CO",
    },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) return notFound();

  const [products, counts] = await Promise.all([
    getProductsByCategory(cat.id),
    getCategoryCounts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <nav
        aria-label="Ruta de navegación"
        className="mb-8 flex items-center gap-1 text-xs text-text-dark/50"
      >
        <Link href="/" className="hover:text-accent">
          Inicio
        </Link>
        <ChevronRight size={13} />
        <span className="text-text-dark/80">Cascos {cat.label}</span>
      </nav>

      <Reveal className="mb-8">
        <p className="eyebrow mb-2 text-accent">Cascos</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {cat.label}
        </h1>
        <p className="mt-3 max-w-prose text-text-dark/60">{cat.blurb}</p>
      </Reveal>

      {/* Cambiar de categoría sin volver a la portada. Solo se ofrecen las
          que tienen productos, para no llevar a una página vacía. */}
      <Reveal className="mb-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.id === cat.id || counts[c.id]).map((c) => {
            const on = c.id === cat.id;
            return (
              <Link
                key={c.id}
                href={categoryHref(c.slug)}
                aria-current={on ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-text-dark/20 text-text-dark/70 hover:border-text-dark/50 hover:text-text-dark"
                }`}
              >
                {c.label}
                <span className={on ? "opacity-70" : "text-text-dark/40"}>
                  {" "}
                  {counts[c.id] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.05} as="div">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal className="rounded-2xl border border-text-dark/10 bg-white px-6 py-16 text-center">
          <p className="text-text-dark/60">
            Todavía no hay cascos {cat.label.toLowerCase()} publicados.
          </p>
          <div className="mt-5 flex justify-center">
            <Cta href="/#catalogo" variant="primary">
              Ver todo el catálogo
            </Cta>
          </div>
        </Reveal>
      )}
    </div>
  );
}
