import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";
import ProductGallery from "@/components/ProductGallery";
import ProductBuy from "@/components/ProductBuy";
import ProductTabs from "@/components/ProductTabs";
import ProductCard from "@/components/ProductCard";
import { formatCOP } from "@/lib/format";
import { getProduct, getProducts, getReviews } from "@/lib/data";
import { categoryLabel } from "@/lib/products";
import { SizeGuideProvider } from "@/lib/SizeGuideContext";

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
  if (!product) return { title: "Producto no encontrado · ROVEX" };

  const title = `${product.name} · ROVEX`;
  const description =
    product.description ??
    `${product.name}: equipamiento premium para motociclistas. Envíos a toda Colombia.`;

  return {
    title,
    description,
    // Al compartir la ficha por WhatsApp se ve la foto del casco. Si el
    // producto aún no tiene foto, Next cae a la imagen de marca del sitio.
    openGraph: {
      type: "website",
      siteName: "ROVEX",
      title,
      description,
      locale: "es_CO",
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    },
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

  // La foto principal (image_url) y la galería de ángulos adicionales
  // (gallery) viven en columnas separadas: la ficha necesita las dos juntas,
  // con la principal primero.
  const images = product.imageUrl
    ? [product.imageUrl, ...product.gallery.filter((u) => u !== product.imageUrl)]
    : product.gallery;

  return (
    <div className="bg-ink text-text-light">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mx-auto flex max-w-7xl items-center gap-1 px-5 py-5 text-xs text-text-light/50 lg:px-8"
      >
        <Link href="/" className="hover:text-accent">Inicio</Link>
        <ChevronRight size={13} />
        <Link href="/#catalogo" className="hover:text-accent">Cascos</Link>
        <ChevronRight size={13} />
        <span className="text-text-light/80">{product.name}</span>
      </nav>

      {/* Galería + compra. Un solo modal de guía de tallas compartido entre
          las dos (ver SizeGuideContext): así nunca hay dos abiertas a la vez. */}
      <SizeGuideProvider>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <Reveal className="relative">
          {product.badge && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white">
              {product.badge}
            </span>
          )}
          <ProductGallery images={images} name={product.name} />
        </Reveal>

        <Reveal delay={0.08} as="div">
          <p className="eyebrow mb-2 text-accent">
            {product.brand} · {categoryLabel(product.category)}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} emptyClassName="text-text-light/25" />
            <span className="text-sm text-text-light/55">
              {product.rating.toFixed(1)} · {product.reviewCount} reseñas
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-accent">
              {formatCOP(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-lg text-text-light/35 line-through">
                {formatCOP(product.compareAt)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-light/50">
            o 4 cuotas sin interés de {formatCOP(Math.round(product.price / 4))}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-text-light/70">
            <ShieldCheck size={16} className="text-accent" />
            2 años de garantía
          </div>

          {product.description && (
            <p className="mt-6 max-w-prose text-text-light/70">
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
        </Reveal>
      </section>
      </SizeGuideProvider>

      {/* Franja de sellos, a todo el ancho */}
      <section className="border-y border-text-light/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-text-light/10 px-5 lg:px-8">
          {SEALS.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 px-3 py-6 text-center"
            >
              <Icon size={22} className="text-accent" />
              <span className="text-xs leading-tight text-text-light/70">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Características + certificación */}
      {product.specs.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <h2 className="mb-6 text-xl font-extrabold tracking-tight">
                Características principales
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {product.specs.map((s) => (
                  <li key={s.label} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-text-light/80">
                      <span className="font-semibold text-text-light">{s.label}:</span>{" "}
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.08} as="div">
              <div className="rounded-2xl border border-text-light/10 bg-white/[0.03] p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-light/50">
                  Certificación
                </h3>
                <div className="flex items-center gap-3 rounded-xl border border-text-light/15 px-4 py-3">
                  <ShieldCheck size={28} className="shrink-0 text-accent" />
                  <div className="text-sm">
                    <p className="font-bold">DOT / ECE 22.06</p>
                    <p className="text-text-light/55">Certificado</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="border-t border-text-light/10">
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
    </div>
  );
}
