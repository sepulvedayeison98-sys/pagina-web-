import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import ProductGallery from "@/components/ProductGallery";
import ProductBuy from "@/components/ProductBuy";
import ProductTabs from "@/components/ProductTabs";
import ProductCard from "@/components/ProductCard";
import { formatCOP } from "@/lib/format";
import { getProduct, getProducts, getReviews } from "@/lib/data";

const SEALS = [
  { Icon: ShieldCheck, label: "ECE 22.06 / DOT" },
  { Icon: Truck, label: "Envío gratis" },
  { Icon: RotateCcw, label: "30 días de cambio" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado · VELTOR" };
  return {
    title: `${product.name} · VELTOR`,
    description:
      product.description ??
      `${product.name}: equipamiento premium para motociclistas. Envíos a toda Colombia.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return notFound();

  const [all, reviews] = await Promise.all([getProducts(), getReviews()]);
  const related = all.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mx-auto flex max-w-7xl items-center gap-1 px-5 py-5 text-xs text-text-dark/50 lg:px-8"
      >
        <Link href="/" className="hover:text-accent">Inicio</Link>
        <ChevronRight size={13} />
        <Link href="/#catalogo" className="hover:text-accent">Cascos</Link>
        <ChevronRight size={13} />
        <span className="text-text-dark/80">{product.name}</span>
      </nav>

      {/* Galería + compra */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <Reveal>
          <ProductGallery images={product.gallery} name={product.name} />
        </Reveal>

        <Reveal delay={0.08} as="div">
          <p className="eyebrow mb-2 text-accent">
            {product.brand} · {product.category}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} />
            <span className="text-sm text-text-dark/55">
              {product.rating.toFixed(1)} · {product.reviewCount} reseñas
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-accent">
              {formatCOP(product.price)}
            </span>
            {product.compareAt && (
              <>
                <span className="text-lg text-text-dark/40 line-through">
                  {formatCOP(product.compareAt)}
                </span>
                <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent">
                  -{Math.round((1 - product.price / product.compareAt) * 100)}%
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-text-dark/50">
            o 4 cuotas sin interés de {formatCOP(Math.round(product.price / 4))}
          </p>

          {product.description && (
            <p className="mt-6 max-w-prose text-text-dark/70">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <ProductBuy
              slug={product.slug}
              name={product.name}
              price={product.price}
              imageUrl={product.imageUrl}
              availableSizes={product.sizes}
            />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {SEALS.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-text-dark/10 bg-white p-3 text-center"
              >
                <Icon size={20} className="text-accent" />
                <span className="text-[0.7rem] leading-tight text-text-dark/60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Tabs */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
          <ProductTabs specs={product.specs} reviews={reviews} />
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Reveal className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              También te puede gustar
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06} as="div">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
