import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Cta from "@/components/Cta";
import Stars from "@/components/Stars";
import ProductGallery from "@/components/ProductGallery";
import SizeSelector from "@/components/SizeSelector";
import ProductTabs from "@/components/ProductTabs";
import ProductCard from "@/components/ProductCard";
import { formatCOP } from "@/lib/format";
import { getProduct, SHPRO_609_GALLERY, PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "SHPRO-609 Jet · VELTOR",
  description:
    "Casco jet SHPRO-609: policarbonato de alta densidad, certificación ECE 22.06, visera solar interna y forro lavable. Premium accesible.",
};

const SEALS = [
  { Icon: ShieldCheck, label: "ECE 22.06 / DOT" },
  { Icon: Truck, label: "Envío gratis" },
  { Icon: RotateCcw, label: "30 días de cambio" },
];

export default function ProductPage() {
  const product = getProduct("shpro-609");
  if (!product) return notFound();

  const related = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 4);

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
          <ProductGallery views={SHPRO_609_GALLERY} />
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
                  -
                  {Math.round(
                    (1 - product.price / product.compareAt) * 100
                  )}
                  %
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-text-dark/50">
            o 4 cuotas sin interés de {formatCOP(product.price / 4)}
          </p>

          <p className="mt-6 max-w-prose text-text-dark/70">
            Casco jet de cara abierta que combina ligereza urbana con protección
            certificada. Visera solar interna, forro lavable antibacterial y
            cierre micrométrico para poner y quitar con una sola mano.
          </p>

          <div className="mt-8">
            <SizeSelector />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Cta variant="primary" full className="sm:flex-1">
              <ShoppingBag size={18} /> Agregar al carrito
            </Cta>
            <Cta variant="secondary">
              <Heart size={18} /> Guardar
            </Cta>
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
          <ProductTabs />
        </div>
      </section>

      {/* Relacionados */}
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
    </>
  );
}
