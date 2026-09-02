import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Globe,
  Truck,
  RotateCcw,
  Banknote,
  Wind,
  Radio,
  Sun,
  Gauge,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import Cta from "@/components/Cta";
import Hero from "@/components/Hero";
import Placeholder from "@/components/Placeholder";
import ZoomTile from "@/components/ZoomTile";
import ProductShowcase from "@/components/ProductShowcase";
import NewsletterForm from "@/components/NewsletterForm";
import ComboOffer from "@/components/ComboOffer";
import PromoBanner from "@/components/PromoBanner";
import Stars from "@/components/Stars";
import anatomiaCasco from "@/assets/anatomia-casco.webp";
import anatomiaCasco3120 from "@/assets/anatomia-casco-3120.webp";
import { CATEGORIES, categoryHref } from "@/lib/products";
import {
  getProducts,
  getReviews,
  getSiteContent,
  getCombo,
} from "@/lib/data";
import { text } from "@/lib/content";

const TRUST_ICONS = [Truck, Globe, RotateCcw, Banknote];
const TECH_ICONS = [Wind, Radio, Sun, Gauge];

export default async function Home() {
  const [products, reviews, content, combo] = await Promise.all([
    getProducts(),
    getReviews(),
    getSiteContent(),
    getCombo(),
  ]);

  const mostrarCombo =
    combo !== null && text(content, "combo.enabled").toLowerCase() !== "no";

  // Oculta hoy: las categorías no tienen foto propia y ZoomTile solo pinta la
  // lámina genérica de la marca, así que la sección se leía como cuatro
  // recuadros vacíos. Se enciende de nuevo desde /admin/contenido.
  const mostrarCategorias =
    text(content, "categorias.enabled").toLowerCase() !== "no";

  // Solo se muestran las categorías con al menos un producto: así
  // Multipropósito aparece sola cuando cargues el primero.
  const conProductos = new Set(products.map((p) => p.category));
  const categoriasVisibles = CATEGORIES.filter((c) => conProductos.has(c.id));

  const TRUST = TRUST_ICONS.map((Icon, i) => ({
    Icon,
    label: text(content, `trust${i + 1}.label`),
    sub: text(content, `trust${i + 1}.sub`),
  }));
  const TECH = TECH_ICONS.map((Icon, i) => ({
    Icon,
    title: text(content, `tech${i + 1}.title`),
    body: text(content, `tech${i + 1}.body`),
  }));

  return (
    <>
      <Hero content={content} />

      {/* ───────────────── TRUST BAR ───────────────── */}
      <section className="border-b border-text-dark/10 bg-paper">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 lg:px-8">
          {TRUST.map(({ Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{label}</p>
                <p className="text-xs text-text-dark/55">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── CUADROS DESTACADOS ───────────────── */}
      <PromoBanner content={content} />

      {/* ───────────────── CATEGORÍAS ───────────────── */}
      {mostrarCategorias && (
        <section id="categorias" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {text(content, "categorias.title")}
              </h2>
            </div>
            <Link
              href="/#catalogo"
              className="hidden items-center gap-1 text-sm font-semibold text-accent hover:gap-2 sm:inline-flex"
            >
              Ver todo <ArrowRight size={16} />
            </Link>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriasVisibles.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.06}>
                <ZoomTile
                  href={categoryHref(cat.slug)}
                  title={cat.label}
                  subtitle={cat.blurb}
                  className="aspect-[3/4]"
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────── CATÁLOGO (scroll horizontal anclado) ───────────────── */}
      <ProductShowcase products={products} />

      {mostrarCombo && <ComboOffer combo={combo!} content={content} />}

      {/* ───────────────── TECNOLOGÍA ───────────────── */}
      <section id="tecnologia" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-2 text-accent">{text(content, "tech.eyebrow")}</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {text(content, "tech.title")}
          </h2>
          <p className="mt-4 text-text-dark/60">
            {text(content, "tech.body")}
          </p>
        </Reveal>

        <div className="mb-14 grid gap-6 lg:grid-cols-2">
          <Reveal
            delay={0.1}
            className="relative aspect-square overflow-hidden rounded-3xl border border-text-dark/10 bg-black shadow-sm"
          >
            <Image
              src={anatomiaCasco}
              alt="Anatomía del casco ROVEX: ventilación superior, carcasa externa en ABS de alta resistencia, mecanismo de visor de liberación rápida, visor antirayas con protección UV, interior desmontable y lavable, ventilación frontal, deflector nasal y cierre micrométrico con ajuste milimétrico."
              fill
              placeholder="blur"
              quality={95}
              sizes="(max-width: 1024px) 90vw, 38rem"
              className="object-contain"
            />
          </Reveal>

          <Reveal
            delay={0.16}
            className="relative aspect-square overflow-hidden rounded-3xl border border-text-dark/10 bg-black shadow-sm"
          >
            <Image
              src={anatomiaCasco3120}
              alt="Anatomía del casco ICH 3120: doble visor (externo transparente + interno parasol ahumado), ventilación superior y frontal, deflector nasal, carcasa en ABS de alta resistencia, mecanismo y palanca de visor, cierre micrométrico, spoiler y ventilación trasera. Peso 1.550 g, tallas S a XXL, certificación DOT / ECE R22.06."
              fill
              placeholder="blur"
              quality={95}
              sizes="(max-width: 1024px) 90vw, 38rem"
              className="object-contain"
            />
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TECH.map(({ Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-text-dark/10 bg-white p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon size={22} />
                </span>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm text-text-dark/60">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── RESEÑAS ───────────────── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {text(content, "reviews.title")}
            </h2>
            <p className="mt-3 text-text-dark/60">{text(content, "reviews.subtitle")}</p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((r, i) => (
              <Reveal key={r.author + r.date} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-text-dark/10 bg-white p-6">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-4 flex-1 text-sm text-text-dark/75">
                    <p className="mb-2 font-semibold text-text-dark">{r.title}</p>
                    “{r.body}”
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-text-dark/50">
                    {r.author} · {r.city}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── COMUNIDAD (Instagram) ───────────────── */}
      <section id="comunidad" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {text(content, "community.title")}
          </h2>
          <p className="mt-3 text-text-dark/60">
            {text(content, "community.subtitle")}
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <ZoomTile href="#" className="aspect-square" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── NEWSLETTER (oscuro) ───────────────── */}
      <section className="bg-ink text-text-light">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-20 text-center lg:px-8">
          <Reveal>
            <p className="eyebrow mb-2 text-accent">{text(content, "newsletter.eyebrow")}</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {text(content, "newsletter.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-text-light/70">
              {text(content, "newsletter.body")}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex w-full justify-center">
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
