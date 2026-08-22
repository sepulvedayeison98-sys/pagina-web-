import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
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
import Stars from "@/components/Stars";
import { CATEGORIES, categoryHref } from "@/lib/products";
import { getProducts, getReviews, getSiteContent } from "@/lib/data";
import { text } from "@/lib/content";

const TRUST_ICONS = [Truck, ShieldCheck, RotateCcw, CreditCard];
const TECH_ICONS = [Wind, Radio, Sun, Gauge];

export default async function Home() {
  const [products, reviews, content] = await Promise.all([
    getProducts(),
    getReviews(),
    getSiteContent(),
  ]);

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

      {/* ───────────────── CATEGORÍAS ───────────────── */}
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

      {/* ───────────────── CATÁLOGO (scroll horizontal anclado) ───────────────── */}
      <ProductShowcase products={products} />

      {/* ───────────────── PROMO (banda oscura) ───────────────── */}
      <section className="bg-ink text-text-light">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {text(content, "promo.title")}
            </h2>
            <p className="mt-4 max-w-lg text-text-light/70">
              {text(content, "promo.body")}
            </p>
            <div className="mt-6">
              <Cta href="/#catalogo" variant="primary">
                {text(content, "promo.cta")} <ArrowRight size={16} />
              </Cta>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Placeholder className="aspect-video w-full rounded-3xl" label="Combo kit" />
          </Reveal>
        </div>
      </section>

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
