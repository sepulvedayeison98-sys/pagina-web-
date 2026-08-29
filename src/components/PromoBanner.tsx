"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Placeholder from "./Placeholder";
import Reveal from "./Reveal";
import type { SiteContent } from "@/lib/content";
import { text } from "@/lib/content";
import promoNuevaColeccion from "@/assets/promo-nueva-coleccion.webp";
import promoOfertas from "@/assets/promo-ofertas.webp";
import promoTecnologia from "@/assets/promo-tecnologia.webp";

/** Fotos de respaldo de los 3 recuadros, en el mismo orden que promo1/2/3. */
const PANEL_IMAGES = [promoNuevaColeccion.src, promoOfertas.src, promoTecnologia.src];

interface Panel {
  title: string;
  badge?: string;
  cta: string;
  href: string;
  image: string;
}

function PromoPanel({ panel }: { panel: Panel }) {
  return (
    <Link
      href={panel.href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-3xl"
    >
      <motion.div
        className="h-full w-full"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      >
        <Placeholder className="h-full w-full" src={panel.image} compact />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/40 to-transparent p-6">
        {panel.badge && (
          <span className="mb-2 w-fit rounded-full bg-accent px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white">
            {panel.badge}
          </span>
        )}
        <h3 className="font-display text-2xl font-extrabold leading-tight text-text-light sm:text-3xl">
          {panel.title}
        </h3>
        <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-light transition-colors group-hover:text-accent">
          {panel.cta} <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Los tres recuadros promocionales bajo el banner principal ("cuadro
 * destacado"): cada uno enlaza a una sección de la tienda. El texto y los
 * enlaces se editan desde /admin/contenido; las fotos de fondo son fijas
 * (PANEL_IMAGES, en el mismo orden que promo1/2/3).
 */
export default function PromoBanner({ content }: { content: SiteContent }) {
  const panels: Panel[] = [1, 2, 3].map((n, i) => ({
    title: text(content, `promo${n}.title`),
    badge: text(content, `promo${n}.badge`) || undefined,
    cta: text(content, `promo${n}.cta`),
    href: text(content, `promo${n}.href`),
    image: PANEL_IMAGES[i],
  }));

  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        {/* Tres recuadros iguales. La altura la marca la proporción de cada
            uno (aspect-[4/3]); no se le fija altura al contenedor, si no los
            recuadros se desbordan y se montan sobre la sección siguiente. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel, i) => (
            <Reveal key={panel.title} delay={i * 0.06}>
              <PromoPanel panel={panel} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
