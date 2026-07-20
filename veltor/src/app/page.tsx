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
import Placeholder from "@/components/Placeholder";
import ZoomTile from "@/components/ZoomTile";
import CatalogSection from "@/components/CatalogSection";
import NewsletterForm from "@/components/NewsletterForm";
import Stars from "@/components/Stars";
import { CATEGORIES, REVIEWS } from "@/lib/products";

const TRUST = [
  { Icon: Truck, label: "Envío gratis", sub: "desde $200.000" },
  { Icon: ShieldCheck, label: "2 años", sub: "de garantía" },
  { Icon: RotateCcw, label: "30 días", sub: "para cambios" },
  { Icon: CreditCard, label: "Paga a cuotas", sub: "sin interés" },
];

const TECH = [
  { Icon: Wind, title: "Aeroventilación", body: "Canales internos que evacúan calor sin sacrificar aerodinámica." },
  { Icon: Radio, title: "Listo para intercom", body: "Alojamientos internos para instalar tu sistema de comunicación." },
  { Icon: Sun, title: "Visera solar interna", body: "Despliegue rápido con un control lateral, incluso con guantes." },
  { Icon: Gauge, title: "Certificación ECE 22.06", body: "Superamos el estándar europeo más exigente en absorción de impactos." },
];

export default function Home() {
  return (
    <>
      {/* ───────────────── HERO (oscuro) ───────────────── */}
      <section className="relative overflow-hidden bg-ink text-text-light">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
          <Reveal>
            <p className="eyebrow mb-4 text-accent">Nueva colección · 2026</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Protección que se
              <br />
              siente <span className="text-accent">premium</span>.
            </h1>
            <p className="mt-6 max-w-md text-lg text-text-light/70">
              Cascos, guantes y tecnología para motociclistas que no negocian
              seguridad ni estilo. Diseñado para la ruta colombiana.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/#catalogo" variant="primary">
                Ver catálogo <ArrowRight size={16} />
              </Cta>
              <Cta href="/producto/shpro-609" variant="secondary" className="!text-text-light !border-white/25 hover:!border-white/60">
                Producto destacado
              </Cta>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <Stars rating={5} />
              <span className="text-sm text-text-light/60">
                +4.800 pilotos ya ruedan con VELTOR
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative">
              <Placeholder
                className="aspect-[4/5] w-full rounded-3xl"
                label="Piloto / moto"
              />
              <div className="absolute -bottom-4 -left-4 rounded-2xl bg-accent px-5 py-4 text-white shadow-lg">
                <p className="text-2xl font-extrabold leading-none">-20%</p>
                <p className="text-xs">en la línea Jet</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

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
            <p className="eyebrow mb-2 text-accent">Encuentra el tuyo</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Categorías
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
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.06}>
              <ZoomTile
                href="/#catalogo"
                title={cat.label}
                subtitle={cat.blurb}
                className="aspect-[3/4]"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── CATÁLOGO (filtro pills) ───────────────── */}
      <section id="catalogo" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal className="mb-4">
            <p className="eyebrow mb-2 text-accent">Lo más buscado</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Catálogo de cascos
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <CatalogSection />
          </Reveal>
        </div>
      </section>

      {/* ───────────────── PROMO (banda oscura) ───────────────── */}
      <section className="bg-ink text-text-light">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <p className="eyebrow mb-3 text-accent">Oferta por tiempo limitado</p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Arma tu kit: casco + guantes con 15% de descuento
            </h2>
            <p className="mt-4 max-w-lg text-text-light/70">
              Combina cualquier casco de la línea Jet o Integral con un par de
              guantes VELTOR y llévate el combo a precio de piloto.
            </p>
            <div className="mt-6">
              <Cta href="/#catalogo" variant="primary">
                Armar mi kit <ArrowRight size={16} />
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
          <p className="eyebrow mb-2 text-accent">Ingeniería VELTOR</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tecnología en cada detalle
          </h2>
          <p className="mt-4 text-text-dark/60">
            Cada casco combina materiales certificados, aerodinámica probada y
            comodidad pensada para jornadas largas.
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
            <p className="eyebrow mb-2 text-accent">Lo que dicen los pilotos</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              4.8 / 5 en satisfacción
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r, i) => (
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
          <p className="eyebrow mb-2 text-accent">#RuedaConVeltor</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Comunidad VELTOR
          </h2>
          <p className="mt-3 text-text-dark/60">
            Etiquétanos en tus rutas y aparece aquí.
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
            <p className="eyebrow mb-2 text-accent">Únete al club</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              10% en tu primera compra
            </h2>
            <p className="mx-auto mt-3 max-w-md text-text-light/70">
              Suscríbete y recibe ofertas, lanzamientos y contenido para pilotos.
              Sin spam.
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
