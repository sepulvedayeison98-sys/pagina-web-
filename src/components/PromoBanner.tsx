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

/**
 * Fotos de los 3 recuadros, en el mismo orden que promo1/2/3.
 *
 * Las dos primeras son piezas verticales: dentro de un recuadro horizontal
 * hay que mostrarlas completas ("contain"), porque recortarlas se comía el
 * casco y el texto de la promo. La tercera sí es horizontal y llena bien.
 */
const PANEL_IMAGES: { src: string; fit: "cover" | "contain" }[] = [
  { src: promoNuevaColeccion.src, fit: "contain" },
  { src: promoOfertas.src, fit: "contain" },
  { src: promoTecnologia.src, fit: "cover" },
];

interface Panel {
  title: string;
  badge?: string;
  cta: string;
  href: string;
  image: string;
  fit: "cover" | "contain";
}

function PromoPanel({ panel }: { panel: Panel }) {
  return (
    <Link
      href={panel.href}
      // Sin borde ni esquinas redondeadas: los tres bloques se leen como una
      // sola escena continua (el fondo y las luces viven en la sección).
      className="group relative block aspect-[4/3] overflow-hidden lg:aspect-[4/5]"
    >
      {/* Se reserva una banda inferior para el texto: así la foto sube y el
          título deja de caerle encima al casco. */}
      <motion.div
        className="h-full w-full pb-20"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      >
        <Placeholder
          className="h-full w-full"
          src={panel.image}
          fit="contain"
          bgClassName="bg-transparent"
          compact
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/45 to-transparent px-6 pb-5 pt-6">
        {panel.badge && (
          <span className="mb-2 w-fit rounded-full bg-accent px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white">
            {panel.badge}
          </span>
        )}
        <h3 className="font-display text-2xl font-extrabold leading-tight text-text-light sm:text-3xl">
          {panel.title}
        </h3>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-light transition-colors group-hover:text-accent">
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
    image: PANEL_IMAGES[i].src,
    fit: PANEL_IMAGES[i].fit,
  }));

  return (
    // Negro puro: es el mismo fondo que traen las tres fotos, así los
    // bloques se funden sin costura visible entre uno y otro.
    <section className="relative overflow-hidden bg-black">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {/* Sin separación entre bloques: los tres forman una sola escena.
            La altura la marca la proporción de cada uno; no se le fija
            altura al contenedor, si no los recuadros se desbordan y se
            montan sobre la sección siguiente. */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3">
          {panels.map((panel, i) => (
            <Reveal key={panel.title} delay={i * 0.06}>
              <PromoPanel panel={panel} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Capas decorativas sobre toda la banda, en "screen": suman luz sin
          tapar ni alterar las fotos, y cruzan los tres bloques a la vez. */}
      <div aria-hidden className="promo-band-glow pointer-events-none absolute inset-0 z-20" />
      <div aria-hidden className="promo-band-lines pointer-events-none absolute inset-0 z-20" />
    </section>
  );
}
