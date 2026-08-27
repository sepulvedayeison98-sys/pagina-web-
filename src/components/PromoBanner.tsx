"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Placeholder from "./Placeholder";
import Reveal from "./Reveal";
import type { SiteContent } from "@/lib/content";
import { text } from "@/lib/content";

interface Panel {
  title: string;
  badge?: string;
  cta: string;
  href: string;
}

function PromoPanel({ panel, tall = false }: { panel: Panel; tall?: boolean }) {
  return (
    <Link
      href={panel.href}
      className={`group relative block overflow-hidden rounded-3xl ${
        tall ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[4/5]"
      }`}
    >
      <motion.div
        className="h-full w-full"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      >
        <Placeholder className="h-full w-full" compact />
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
 * enlaces se editan desde /admin/contenido; las imágenes de fondo caen al
 * panel de marca (Placeholder) hasta que se suban fotos reales.
 */
export default function PromoBanner({ content }: { content: SiteContent }) {
  const panels: Panel[] = [1, 2, 3].map((n) => ({
    title: text(content, `promo${n}.title`),
    badge: text(content, `promo${n}.badge`) || undefined,
    cta: text(content, `promo${n}.cta`),
    href: text(content, `promo${n}.href`),
  }));

  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 lg:h-[520px] lg:grid-cols-2">
          <Reveal className="lg:row-span-2">
            <PromoPanel panel={panels[0]} tall />
          </Reveal>
          <Reveal delay={0.06}>
            <PromoPanel panel={panels[1]} />
          </Reveal>
          <Reveal delay={0.12}>
            <PromoPanel panel={panels[2]} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
